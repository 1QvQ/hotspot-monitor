import nodemailer from 'nodemailer';

interface Hotspot {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  importance: string;
  relevance: number;
  summary: string | null;
  createdAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let transporter: any = null;

function getTransporter(): any {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email configuration incomplete, notifications disabled');
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return transporter;
}

export async function sendHotspotEmail(hotspot: Hotspot & { keyword?: { text: string } | null }): Promise<boolean> {
  const mailer = getTransporter();
  
  if (!mailer || !process.env.NOTIFY_EMAIL) {
    return false;
  }

  const importanceEmoji: Record<string, string> = {
    low: '📌',
    medium: '⚡',
    high: '🔥',
    urgent: '🚨'
  };

  const emoji = importanceEmoji[hotspot.importance] || '📌';

  try {
    await mailer.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.NOTIFY_EMAIL,
      subject: `${emoji} Hotspot Alert: ${hotspot.title.slice(0, 50)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            .badge-urgent { background: #ff4757; color: white; }
            .badge-high { background: #ff6b35; color: white; }
            .badge-medium { background: #ffa502; color: white; }
            .badge-low { background: #2ed573; color: white; }
            .meta { color: #666; font-size: 14px; margin: 10px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">${emoji} New Hotspot Discovered</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">From Hotspot Monitoring System</p>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">${hotspot.title}</h2>
              
              <p><span class="badge badge-${hotspot.importance}">${hotspot.importance.toUpperCase()}</span></p>
              
              ${hotspot.summary ? `<p><strong>Summary: </strong>${hotspot.summary}</p>` : ''}
              
              <div class="meta">
                <p><strong>Source: </strong>${hotspot.source}</p>
                <p><strong>Relevance Score: </strong>${hotspot.relevance}/100</p>
                ${hotspot.keyword ? `<p><strong>Keyword: </strong>${hotspot.keyword.text}</p>` : ''}
                <p><strong>Discovery Time: </strong>${new Date(hotspot.createdAt).toLocaleString('en-US')}</p>
              </div>
              
              <a href="${hotspot.url}" class="button">View Original →</a>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`Email sent for hotspot: ${hotspot.id}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendDigestEmail(hotspots: Hotspot[]): Promise<boolean> {
  const mailer = getTransporter();
  
  if (!mailer || !process.env.NOTIFY_EMAIL || hotspots.length === 0) {
    return false;
  }

  try {
    const hotspotsHtml = hotspots.map(h => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <a href="${h.url}" style="color: #667eea; text-decoration: none;">${h.title.slice(0, 60)}...</a>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${h.source}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${h.importance}</td>
      </tr>
    `).join('');

    await mailer.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.NOTIFY_EMAIL,
      subject: `📊 Hotspot Monitor Daily Report - ${hotspots.length} New Hotspots`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
          <h1>📊 Hotspot Monitor Daily Report</h1>
          <p>Found <strong>${hotspots.length}</strong> new hotspots in the last 24 hours</p>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 10px; text-align: left;">Title</th>
                <th style="padding: 10px; text-align: left;">Source</th>
                <th style="padding: 10px; text-align: left;">Importance</th>
              </tr>
            </thead>
            <tbody>
              ${hotspotsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `
    });

    return true;
  } catch (error) {
    console.error('Failed to send digest email:', error);
    return false;
  }
}
