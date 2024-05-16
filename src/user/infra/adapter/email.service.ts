import { Injectable } from '@nestjs/common'
import { EmailService as ExternalEmailService } from '@email/email.service'
import { IEmailService } from '@user/app/adapter/email.service.interface'

@Injectable()
export class EmailService implements IEmailService {
  constructor(private emailService: ExternalEmailService) {}

  async sendMemberJoinVerification(
    email: string,
    signupVerifyToken: string,
  ): Promise<void> {
    this.emailService.sendMemberJoinVerification(email, signupVerifyToken)
  }
}
