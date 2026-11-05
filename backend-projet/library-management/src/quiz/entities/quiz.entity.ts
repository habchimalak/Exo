import { Question } from './question.entity.js';

export class Quiz {
  id: number;
  titre: string;
  theme: string;
  matiere: string;
  niveau: 'debutant' | 'intermediaire' | 'avance';
  statut: 'brouillon' | 'valide';
  visibilite: 'prive' | 'public';
  dateGeneration: Date;
  questions: Question[];
  contenuIA?: string;
  auteurId?: number;
  typeIA?: 'quiz' | 'serie' | 'examen';
  // Archivage
  archived: boolean;
  archivedAt?: Date;
  // Partage public
  shareToken?: string;
  resultats?: QuizResultat[];
}

export class QuizResultat {
  id: number;
  nom: string;
  prenom: string;
  score: number;        // nombre de bonnes réponses
  total: number;        // nombre total de questions
  note: number;         // note sur 20
  pourcentage: number;
  date: Date;
  reponses: { questionId: number; choix: string; correct: boolean }[];
}
