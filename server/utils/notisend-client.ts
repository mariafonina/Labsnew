import crypto from "crypto";

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
  private baseUrl: string = "https://api.notisend.ru/v1";

  constructor() {
    this.apiKey = process.env.NOTISEND_API_KEY || "";
    this.projectName = process.env.NOTISEND_PROJECT_NAME || "";

    // В dev окружении можно работать без Notisend
    if (!this.apiKey || !this.projectName) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          "NOTISEND_API_KEY and NOTISEND_PROJECT_NAME must be set in environment variables",
        );
      }
      console.warn('⚠️  Notisend credentials not set. Email functionality will be disabled.');
    }
  }

  private generateSignature(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    const values = sortedKeys.map((key) => params[key]);
    values.push(this.apiKey);
    const concatenated = values.join(";");
    const sha1Hash = crypto
      .createHash("sha1")
      .update(concatenated)
      .digest("hex");
    const md5Hash = crypto.createHash("md5").update(sha1Hash).digest("hex");
    return md5Hash;
  }

  async sendEmail(params: NotisendEmailParams): Promise<any> {
    // Проверка credentials
    if (!this.apiKey || !this.projectName) {
      console.warn('⚠️  Notisend not configured. Email not sent:', params.to);
      return { success: false, message: 'Email service not configured' };
    }

    try {
      // Валидация параметров
      if (!params.to || !params.subject) {
        throw new Error('Email "to" and "subject" are required');
      }

      const emailData: Record<string, any> = {
        project: this.projectName,
        to: params.to,
        subject: params.subject,
        html: params.html || "",
      };

      if (params.text) emailData.text = params.text;
      if (params.from_email) emailData.from_email = params.from_email;
      if (params.from_name) emailData.from_name = params.from_name;
      if (params.template_id) emailData.template_id = params.template_id;
      if (params.template_data) {
        emailData.template_data =
          typeof params.template_data === "string"
            ? params.template_data
            : JSON.stringify(params.template_data);
      }

      console.log(
        `[Notisend] Sending email to ${params.to}, project: ${this.projectName}`,
      );
      console.log(`[Notisend] Request URL: ${this.baseUrl}/email/messages`);
      console.log(`[Notisend] Using Bearer token auth`);

      const response = await fetch(`${this.baseUrl}/email/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(emailData),
      });

      const responseText = await response.text();
      console.log(`[Notisend] Response status: ${response.status}`);
      console.log(
        `[Notisend] Response body: ${responseText.substring(0, 200)}`,
      );

      if (!response.ok) {
        let errorMessage = `Notisend API error: ${response.status}`;
        try {
          const errorJson = JSON.parse(responseText);
          errorMessage += ` - ${errorJson.error || errorJson.message || responseText}`;
        } catch {
          errorMessage += ` - ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      try {
        return JSON.parse(responseText);
      } catch {
        return { success: true, message: responseText };
      }
    } catch (error: any) {
      console.error("[Notisend] sendEmail error:", error);
      console.error("[Notisend] Error details:", {
        message: error.message,
        stack: error.stack,
        project: this.projectName,
        to: params.to,
      });
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
        results.push({ email: recipient, status: "sent", result });
      } catch (error: any) {
        errors.push({
          email: recipient,
          status: "failed",
          error: error.message,
        });
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

  async sendTemplateEmail(
    to: string,
    templateId: string,
    templateData: Record<string, any>,
    subject?: string,
    from_email: string = 'noreply@mariafonina.ru',
    from_name: string = 'ЛАБС',
  ): Promise<any> {
    return this.sendEmail({
      to,
      subject: subject || "Уведомление",
      html: "",
      template_id: templateId,
      template_data: templateData,
      from_email,
      from_name,
    });
  }

  async sendBulkTemplateEmail(
    recipients: string[],
    templateId: string,
    templateDataMap: Record<string, any> = {},
    subject?: string,
    from_email: string = 'noreply@mariafonina.ru',
    from_name: string = 'ЛАБС',
  ): Promise<any> {
    const results = [];
    const errors = [];

    for (const recipient of recipients) {
      try {
        const templateData = templateDataMap[recipient] || {};
        const result = await this.sendTemplateEmail(
          recipient,
          templateId,
          templateData,
          subject,
          from_email,
          from_name,
        );
        results.push({ email: recipient, status: "sent", result });
      } catch (error: any) {
        errors.push({
          email: recipient,
          status: "failed",
          error: error.message,
        });
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
