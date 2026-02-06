import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email, code) => {
  try {
    const { data, error } = await resend.emails.send({
    // Change this from onboarding@resend.dev to your domain!
    from: 'ChoicePhoto <verification@choicephoto.app>', 
    to: [email],
    subject: 'ChoicePhoto 이메일 인증 코드',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Verify your email</h2>
          <p>Your 6-digit verification code is:</p>
          <h1 style="color: #4F46E5; letter-spacing: 5px;">${code}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Email sending failed:", err);
    throw new Error("이메일 발송에 실패했습니다.");
  }
};

/** Send congratulations email after successful signup. */
export const sendCongratsEmail = async (email, nickname) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'ChoicePhoto <verification@choicephoto.app>',
      to: [email],
      subject: 'ChoicePhoto 가입을 환영합니다!',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>가입 완료</h2>
          <p><strong>${nickname}</strong>님, ChoicePhoto(최애의포토) 회원가입이 완료되었습니다.</p>
          <p>앞으로 많은 이용 부탁드립니다.</p>
        </div>
      `,
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Congrats email failed:", err);
    throw new Error("환영 이메일 발송에 실패했습니다.");
  }
};