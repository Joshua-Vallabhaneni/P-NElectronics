import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    const supabase = createServerSupabaseClient();

    try {
        const body = await request.json();

        const {
            company_name,
            contact_name,
            email,
            phone,
            category,
            quantity,
            brand_model,
            processor,
            ram,
            storage_type,
            condition,
            spreadsheet_url,
            image_urls,
        } = body;

        // Save to database
        const { data: quoteData, error: dbError } = await supabase
            .from('quote_requests')
            .insert({
                company_name: company_name || null,
                contact_name,
                email,
                phone: phone || null,
                category,
                quantity,
                brand_model: brand_model || null,
                processor: processor || null,
                ram: ram || null,
                storage_type: storage_type || null,
                condition,
                spreadsheet_url: spreadsheet_url || null,
                image_urls: image_urls || null,
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json({ error: 'Failed to save quote request', details: dbError.message }, { status: 500 });
        }

        // Send email notification
        const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">New Quote Request Received</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #334155;">Contact Information</h3>
          <p><strong>Name:</strong> ${contact_name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${company_name ? `<p><strong>Company:</strong> ${company_name}</p>` : ''}
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #334155;">Item Details</h3>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Quantity:</strong> ${quantity}</p>
          <p><strong>Condition:</strong> ${condition.replace('_', ' ')}</p>
          ${brand_model ? `<p><strong>Brand/Model:</strong> ${brand_model}</p>` : ''}
          ${processor ? `<p><strong>Processor:</strong> ${processor}</p>` : ''}
          ${ram ? `<p><strong>RAM:</strong> ${ram}</p>` : ''}
          ${storage_type ? `<p><strong>Storage:</strong> ${storage_type}</p>` : ''}
        </div>

        ${spreadsheet_url ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📄 Spreadsheet uploaded:</strong> <a href="${spreadsheet_url}">Download</a></p>
          </div>
        ` : ''}

        ${image_urls && image_urls.length > 0 ? `
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #334155;">Uploaded Images (${image_urls.length})</h3>
            ${image_urls.map((url: string) => `<a href="${url}" style="display: inline-block; margin: 5px;"><img src="${url}" width="100" style="border-radius: 4px;" /></a>`).join('')}
          </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
          <p>View and respond to this quote in your <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/quotes">Admin Dashboard</a></p>
        </div>
      </div>
    `;

        // Send the email
        const { error: emailError } = await resend.emails.send({
            from: 'P&N Electronics <onboarding@resend.dev>',
            to: ['pjvallabhaneni@gmail.com'],
            subject: `New Quote Request: ${quantity}x ${category} from ${contact_name}`,
            html: emailHtml,
        });

        if (emailError) {
            console.error('Email error:', emailError);
            // Don't fail the request if email fails - quote is still saved
        }

        return NextResponse.json({ success: true, data: quoteData });
    } catch (error) {
        console.error('Error processing quote:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
