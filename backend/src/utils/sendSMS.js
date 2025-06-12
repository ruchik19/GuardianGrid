import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendSMS = async (to, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log('SMS sent to', to);
    return result.sid;
  } catch (error) {
    console.error('SMS error:', error.message);
    throw error;
  }
};