/**
 * Cloudflare Pages Function: /api/submit
 * 
 * Secure edge proxy for forwarding website quote and contact forms to GoHighLevel (GHL).
 * Keeps the GHL webhook URL completely hidden from browser DevTools, network tabs, and client-side code.
 */

// Fallback webhook provided by user (used automatically with zero Cloudflare configuration).
// Can also be overridden anytime in Cloudflare Pages Dashboard (Settings > Environment variables > GHL_WEBHOOK_URL).
const DEFAULT_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/rU55IFhIh72Uw01kikrx/webhook-trigger/16b2ca05-ede0-4e31-b55e-767b5ae93f52';

const SERVICE_LABELS = {
    'bedliner': 'High-Pressure Spray-On Bedliner',
    'uv_topcoat': 'UV Premium Protective Topcoat',
    'rocker_panels': 'Rocker Panels & Cab Corners',
    'wheel_wells': 'Inner Wheel Wells',
    'undercoating': 'Chassis Rust-Proof Undercoating',
    'fleet': 'Commercial Fleet Drop-Off Package'
};

const BED_LENGTH_LABELS = {
    '5.5ft': 'Short Bed (5.5 ft to 5.8 ft)',
    '6.5ft': 'Standard Bed (6.5 ft)',
    '8ft': 'Long Bed (8.0 ft)',
    'dually': '8.0 ft Dually Bed',
    'utility_flatbed': 'Commercial Utility Body / Flatbed'
};

const RAIL_COVERAGE_LABELS = {
    'under-rail': 'Under-the-Rail (Preserves factory plastic caps)',
    'over-rail': 'Over-the-Rail (Full rail top encapsulation)'
};

const DROP_TIME_LABELS = {
    'morning': 'Morning Drop-Off (7:30 AM - 9:00 AM)',
    'midday': 'Midday Drop-Off (11:30 AM - 1:00 PM)',
    'afternoon': 'Afternoon Drop-Off (2:00 PM - 4:00 PM)',
    'next_day': 'Next-Day / Flexible Drop-Off'
};

export async function onRequestPost(context) {
    const { request, env } = context;

    // Set CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const body = await request.json();

        // 1. Anti-Spam Honeypot Check:
        // If the invisible bot field is filled, silently succeed without triggering GHL.
        if (body._gotcha || body.honeypot) {
            console.warn('Bot submission trapped by honeypot.');
            return new Response(JSON.stringify({ success: true, message: 'Submission received' }), {
                status: 200,
                headers: corsHeaders
            });
        }

        // 2. Validate essential fields
        if (!body.name || !body.phone || !body.email) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Missing required contact fields: Name, Phone, and Email are required.' 
            }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // 3. Name parsing (first and last name for CRM)
        const nameParts = (body.name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        // 4. Resolve Webhook URL (Environment Variable takes precedence, falls back to default)
        const webhookUrl = env?.GHL_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

        // 5. Format services & vehicle configuration
        const rawServices = Array.isArray(body.services) 
            ? body.services 
            : (body.services ? [body.services] : []);
        const formattedServices = rawServices.map(s => SERVICE_LABELS[s] || s);
        const servicesString = formattedServices.join(', ');

        const bedLengthFormatted = BED_LENGTH_LABELS[body.bed_length] || body.bed_length || '';
        const railCoverageFormatted = RAIL_COVERAGE_LABELS[body.rail_coverage] || body.rail_coverage || '';
        const dropTimeFormatted = DROP_TIME_LABELS[body.drop_time] || body.drop_time || '';

        const formType = body.form_type === 'contact' ? 'Contact Inquiry' : 'Quote Request';
        const isQuote = formType === 'Quote Request';

        // Vehicle summary string
        const vehicleSummary = [body.year, body.make, body.model].filter(Boolean).join(' ');

        // 6. Build GHL Tags with Source Attribution
        const tags = isQuote 
            ? ['Website Lead', 'In-Shop Quote Request', 'Royse City Shop'] 
            : ['Website Lead', 'Contact Inquiry', 'Royse City Shop'];

        if (body.lead_source && !body.lead_source.toLowerCase().includes('direct')) {
            tags.push(`Source: ${body.lead_source}`);
        }

        // 7. Build GoHighLevel Payload
        const ghlPayload = {
            // Standard GHL Contact & Source Fields
            first_name: firstName,
            last_name: lastName,
            name: body.name.trim(),
            email: body.email.trim(),
            phone: body.phone.trim(),
            source: body.lead_source || 'Website Lead',

            // GHL Tags
            tags: tags,

            // Campaign & Ad Attribution (GHL native & custom fields)
            lead_source: body.lead_source || 'Direct / Organic',
            initial_referrer: body.initial_referrer || 'Direct / None',
            first_landing_page: body.first_landing_page || '',
            submission_page: body.submission_page || body.source_page || '',
            utm_source: body.utm_source || '',
            utm_medium: body.utm_medium || '',
            utm_campaign: body.utm_campaign || '',
            utm_content: body.utm_content || '',
            utm_term: body.utm_term || '',
            gclid: body.gclid || '',
            fbclid: body.fbclid || '',

            // Metadata
            form_type: formType,
            source_page: body.source_page || request.headers.get('referer') || 'Blackhawk Protective Coatings Website',
            submission_time: new Date().toISOString(),
            client_ip: request.headers.get('cf-connecting-ip') || 'unknown',

            // Vehicle & Bed Custom Fields (Quote Form)
            vehicle_year: body.year || '',
            vehicle_make: body.make || '',
            vehicle_model: body.model || '',
            vehicle_details: vehicleSummary,
            bed_length: bedLengthFormatted,
            rail_coverage: railCoverageFormatted,
            services_requested: servicesString,
            services_list: formattedServices,
            preferred_drop_off: dropTimeFormatted,
            notes: body.notes || '',

            // Contact Form Custom Fields
            subject: body.subject || '',
            message: body.message || ''
        };

        // 7. Dispatch directly to GoHighLevel Inbound Webhook
        const ghlResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Blackhawk-Cloudflare-Pages-Webhook/1.0'
            },
            body: JSON.stringify(ghlPayload)
        });

        if (!ghlResponse.ok) {
            const errorText = await ghlResponse.text();
            console.error('GHL Webhook returned non-200:', ghlResponse.status, errorText);
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Failed to dispatch to CRM provider' 
            }), {
                status: 502,
                headers: corsHeaders
            });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Lead delivered to CRM successfully' 
        }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (err) {
        console.error('Error processing form submission:', err);
        return new Response(JSON.stringify({ 
            success: false, 
            error: 'Internal server error processing submission' 
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }
    });
}
