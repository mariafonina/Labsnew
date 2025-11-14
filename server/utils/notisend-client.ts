import crypto from 'crypto';

interface NotisendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from_email?: string;
  from_name?: string;
  template_id?: string;
  template_data?: Record<string, any>;
}

interface NotisendBulkEmailParams {
  recipients: string[];
  subject: string;
  html: string;
  text?: string;
  from_email?: string;
  from_name?: string;
  template_id?: string;
  template_data?: Record<string, any>;
}

class NotisendClient {
  private apiKey: string;
  private projectName: string;
  private baseUrl: string = 'https://api.notisend.ru/v1';

  constructor() {
    this.apiKey = process.env.NOTISEND_API_KEY || '';
    this.projectName = process.env.NOTISEND_PROJECT_NAME || '';

    if (!this.apiKey || !this.projectName) {
      throw new Error('NOTISEND_API_KEY and NOTISEND_PROJECT_NAME must be set in environment variables');
    }
  }

  private generateSignature(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    const values = sortedKeys.map(key => params[key]);
    values.push(this.apiKey);
    const concatenated = values.join(';');
    const sha1Hash = crypto.createHash('sha1').update(concatenated).digest('hex');
    const md5Hash = crypto.createHash('md5').update(sha1Hash).digest('hex');
    return md5Hash;
  }

  async sendEmail(params: NotisendEmailParams): Promise<any> {
    try {
      const emailData: Record<string, any> = {
        project: this.projectName,
        to: params.to,
        subject: params.subject,
        html: params.html,
      };

      if (params.text) emailData.text = params.text;
      if (params.from_email) emailData.from_email = params.from_email;
      if (params.from_name) emailData.from_name = params.from_name;
      if (params.template_id) emailData.template_id = params.template_id;
      if (params.template_data) emailData.template_data = JSON.stringify(params.template_data);

      const signature = this.generateSignature(emailData);
      emailData.sign = signature;

      const response = await fetch(`${this.baseUrl}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Notisend API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Notisend sendEmail error:', error);
      throw error;
    }
  }

  async sendBulkEmail(params: NotisendBulkEmailParams): Promise<any> {
    const results = [];
    const errors = [];

    for (const recipient of params.recipients) {
      try {
        const result = await this.sendEmail({
          to: recipient,
          subject: params.subject,
          html: params.html,
          text: params.text,
          from_email: params.from_email,
          from_name: params.from_name,
          template_id: params.template_id,
          template_data: params.template_data,
        });
        results.push({ email: recipient, status: 'sent', result });
      } catch (error: any) {
        errors.push({ email: recipient, status: 'failed', error: error.message });
      }
    }

    return {
      total: params.recipients.length,
      sent: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  async sendTemplateEmail(to: string, templateId: string, templateData: Record<string, any>, subject?: string): Promise<any> {
    return this.sendEmail({
      to,
      subject: subject || 'Уведомление', 
      html: '',
      template_id: templateId,
      template_data: templateData,
    });
  }

  async sendBulkTemplateEmail(recipients: string[], templateId: string, templateDataMap: Record<string, any> = {}, subject?: string): Promise<any> {
    const results = [];
    const errors = [];

    for (const recipient of recipients) {
      try {
        const templateData = templateDataMap[recipient] || {};
        const result = await this.sendTemplateEmail(recipient, templateId, templateData, subject);
        results.push({ email: recipient, status: 'sent', result });
      } catch (error: any) {
        errors.push({ email: recipient, status: 'failed', error: error.message });
      }
    }

    return {
      total: recipients.length,
      sent: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }
}

export const notisendClient = new NotisendClient();
