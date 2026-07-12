class EmailService {
  async generateEmail({ recipient, tone, subject, context }) {
    const safeRecipient = recipient || 'Valued Client';
    const safeSubject = subject || 'Project Update & Next Steps';
    const safeTone = tone || 'Professional';
    const safeContext = context || 'the progress on our latest design sprint';

    return `Subject: ${safeSubject}
Tone: ${safeTone}

Dear ${safeRecipient},

I hope this email finds you well.

I am writing to share a brief update regarding ${safeContext}. Our team has made significant progress, and we are on track with our milestones.

Please let us know if you have any questions, or if you would like to schedule a quick call to go over the details.

Best regards,
The Lumina Team`;
  }
}

module.exports = new EmailService();
