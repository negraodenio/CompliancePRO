import OpenAI from 'openai';

type CreditApplication = {
  applicantId: string;
  requestedAmount: number;
  monthlyIncome: number;
};

const client = new OpenAI({
  apiKey: process.env.CGAG_LAB_FAKE_OPENAI_KEY
});

export async function creditReviewAgent(application: CreditApplication) {
  const riskSignal = application.requestedAmount / Math.max(application.monthlyIncome, 1);

  return client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a governed credit review agent. Human approval is required for adverse decisions.'
      },
      {
        role: 'user',
        content: `Review applicant ${application.applicantId} with risk signal ${riskSignal.toFixed(2)}.`
      }
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'request_human_approval',
          description: 'Routes a credit decision to a human reviewer before execution.',
          parameters: {
            type: 'object',
            properties: {
              applicantId: { type: 'string' },
              reason: { type: 'string' }
            },
            required: ['applicantId', 'reason']
          }
        }
      }
    ]
  });
}
