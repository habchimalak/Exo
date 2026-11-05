import { Injectable, BadRequestException } from '@nestjs/common';
import { google } from 'googleapis';
import { QuizService } from '../quiz/quiz.service.js';
import { Quiz, QuizResultat } from '../quiz/entities/quiz.entity.js';

@Injectable()
export class GoogleFormsService {
  private refreshToken: string | null = null;

  constructor(private readonly quizService: QuizService) {}

  // ─── OAuth2 client ─────────────────────────────────────────────────────────

  private getOAuth2Client() {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
    if (this.refreshToken) {
      client.setCredentials({ refresh_token: this.refreshToken });
    }
    return client;
  }

  // ─── Public methods ────────────────────────────────────────────────────────

  getAuthUrl(): string {
    const client = this.getOAuth2Client();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/forms.body',
        'https://www.googleapis.com/auth/forms.responses.readonly',
      ],
    });
  }

  async handleCallback(code: string): Promise<void> {
    const client = this.getOAuth2Client();
    const { tokens } = await client.getToken(code);
    // Google only returns refresh_token on first consent — keep existing if new one is null
    if (tokens.refresh_token) {
      this.refreshToken = tokens.refresh_token;
    }
    if (!this.refreshToken) {
      throw new BadRequestException(
        'Aucun refresh token reçu. Veuillez révoquer l\'accès dans votre compte Google puis réessayer.',
      );
    }
  }

  isConnected(): { connected: boolean } {
    return { connected: this.refreshToken !== null };
  }

  async exportQuiz(quizId: number): Promise<{ lien: string; formId: string }> {
    const quiz = this.quizService.findOne(quizId);

    if (!quiz.questions || quiz.questions.length === 0) {
      throw new BadRequestException(
        'Ce quiz ne contient aucune question. Ajoutez des questions avant d\'exporter',
      );
    }

    if (!this.refreshToken) {
      throw new BadRequestException(
        'Veuillez d\'abord connecter votre compte Google',
      );
    }

    // Return existing form if already exported
    if (quiz.googleFormId) {
      return { lien: quiz.googleFormUrl!, formId: quiz.googleFormId };
    }

    try {
      const auth = this.getOAuth2Client();
      const forms = google.forms({ version: 'v1', auth });

      // 1. Create form with title
      const createResponse = await forms.forms.create({
        requestBody: { info: { title: quiz.titre } },
      });
      const formId = createResponse.data.formId!;

      // 2. batchUpdate: isQuiz, Nom, Matricule, then each question
      const requests: any[] = [];

      // a) Set isQuiz = true first
      requests.push({
        updateSettings: {
          settings: { quizSettings: { isQuiz: true } },
          updateMask: 'quizSettings',
        },
      });

      // b) Add "Nom complet" text field
      requests.push({
        createItem: {
          item: {
            title: 'Nom',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: false },
              },
            },
          },
          location: { index: 0 },
        },
      });

      // c) Add "Matricule" text field
      requests.push({
        createItem: {
          item: {
            title: 'Matricule',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: false },
              },
            },
          },
          location: { index: 1 },
        },
      });

      // d) Add each question as RADIO with grading
      quiz.questions.forEach((q, i) => {
        const correctChoiceKey = `choix${q.reponseCorrecte}` as keyof typeof q;
        const correctValue = q[correctChoiceKey] as string;

        requests.push({
          createItem: {
            item: {
              title: q.enonce,
              questionItem: {
                question: {
                  required: true,
                  grading: {
                    pointValue: 1,
                    correctAnswers: {
                      answers: [{ value: correctValue }],
                    },
                  },
                  choiceQuestion: {
                    type: 'RADIO',
                    options: [
                      { value: q.choixA },
                      { value: q.choixB },
                      { value: q.choixC },
                      { value: q.choixD },
                    ],
                  },
                },
              },
            },
            location: { index: i + 2 },
          },
        });
      });

      await forms.forms.batchUpdate({
        formId,
        requestBody: { requests },
      });

      // 3. Fetch the form to get responderUri
      const formData = await forms.forms.get({ formId });
      const responderUri = formData.data.responderUri ?? `https://docs.google.com/forms/d/${formId}/viewform`;

      // 4. Persist on quiz object
      quiz.googleFormId = formId;
      quiz.googleFormUrl = responderUri;
      quiz.googleFormResponderUri = responderUri;

      return { lien: responderUri, formId };
    } catch (err: any) {
      this.mapGoogleError(err);
      throw err; // unreachable, but satisfies TS
    }
  }

  async syncNotes(quizId: number): Promise<{ resultats: QuizResultat[] }> {
    const quiz = this.quizService.findOne(quizId);

    if (!quiz.googleFormId) {
      throw new BadRequestException(
        'Ce quiz n\'a pas encore été exporté vers Google Forms',
      );
    }

    if (!this.refreshToken) {
      throw new BadRequestException(
        'Veuillez d\'abord connecter votre compte Google',
      );
    }

    if (!quiz.resultats) quiz.resultats = [];

    try {
      const auth = this.getOAuth2Client();
      const forms = google.forms({ version: 'v1', auth });

      let pageToken: string | undefined;
      const allResponses: any[] = [];

      // Paginate through all responses
      do {
        const listResp = await forms.forms.responses.list({
          formId: quiz.googleFormId,
          ...(pageToken ? { pageToken } : {}),
        });
        const responses = listResp.data.responses ?? [];
        allResponses.push(...responses);
        pageToken = listResp.data.nextPageToken ?? undefined;
      } while (pageToken);

      const maxScore = quiz.questions.length;

      for (const response of allResponses) {
        const responseId: string = response.responseId;

        // Deduplicate by responseId
        const alreadyExists = quiz.resultats.some(
          (r: QuizResultat & { googleResponseId?: string }) =>
            r.googleResponseId === responseId,
        );
        if (alreadyExists) continue;

        // Extract answers — keys are item IDs; we rely on order
        const answers = response.answers ?? {};
        const answerValues = Object.values(answers) as any[];

        // First text answer = Nom, second = Matricule
        const textAnswers = answerValues.filter(
          (a: any) => a.textAnswers?.answers?.[0]?.value !== undefined,
        );
        const nom = textAnswers[0]?.textAnswers?.answers?.[0]?.value ?? '';
        const matricule = textAnswers[1]?.textAnswers?.answers?.[0]?.value ?? '';

        const totalScore: number = response.totalScore ?? 0;
        const note = maxScore > 0
          ? Math.round((totalScore / maxScore) * 20 * 100) / 100
          : 0;
        const pourcentage = maxScore > 0
          ? Math.round((totalScore / maxScore) * 100)
          : 0;

        const resultat: QuizResultat & { googleResponseId?: string } = {
          id: (quiz.resultats.length) + 1,
          nom,
          prenom: matricule, // using prenom field to carry matricule value
          score: totalScore,
          total: maxScore,
          note,
          pourcentage,
          date: new Date(response.lastSubmittedTime),
          reponses: [],
          googleResponseId: responseId,
        };

        quiz.resultats.push(resultat);
      }

      return { resultats: quiz.resultats };
    } catch (err: any) {
      this.mapGoogleError(err);
      throw err;
    }
  }

  // ─── Error mapping ─────────────────────────────────────────────────────────

  private mapGoogleError(err: any): never {
    const status = err.status ?? err.code;
    if (status === 401 || status === 403) {
      throw new BadRequestException(
        'Token Google expiré. Reconnectez votre compte Google (le mode test expire après 7 jours)',
      );
    }
    if (status === 429) {
      throw new BadRequestException(
        'Quota Google dépassé. Réessayez dans quelques minutes',
      );
    }
    if (status === 404) {
      throw new BadRequestException(
        'Le formulaire Google a été supprimé. Exportez à nouveau le quiz',
      );
    }
    throw err;
  }
}
