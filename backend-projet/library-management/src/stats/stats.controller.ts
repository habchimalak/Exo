import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserService } from '../user/user.service.js';
import { MatiereService } from '../matiere/matiere.service.js';
import { PromotionService } from '../promotion/promotion.service.js';
import { ArchiveService } from '../archive/archive.service.js';
import { ContentService } from '../content/content.service.js';
import { QuizService } from '../quiz/quiz.service.js';
import { GenerationsService } from '../generations/generations.service.js';

@Controller('stats')
@Roles('administrateur')
export class StatsController {
  constructor(
    private readonly userService: UserService,
    private readonly matiereService: MatiereService,
    private readonly promotionService: PromotionService,
    private readonly archiveService: ArchiveService,
    private readonly contentService: ContentService,
    private readonly quizService: QuizService,
    private readonly generationsService: GenerationsService,
  ) {}

  // GET /stats — statistiques globales pour le dashboard admin
  @Get()
  getStats() {
    const users       = this.userService.findAll();
    const admins      = users.filter((u) => u.role === 'admin' || u.role === 'administrateur').length;
    const enseignants = users.filter((u) => u.role === 'enseignant').length;
    const actifs      = users.filter((u) => u.actif !== false).length;

    const matieres   = this.matiereService.findAll();
    const promotions = this.promotionService.findAll();
    const archives   = this.archiveService.findAll();

    // Contenus pédagogiques
    const allContents = this.contentService.findAll({});
    const contentsParType = {
      cours:   allContents.data.filter((c) => c.type === 'cours').length,
      resume:  allContents.data.filter((c) => c.type === 'resume').length,
      serie:   allContents.data.filter((c) => c.type === 'serie').length,
      examen:  allContents.data.filter((c) => c.type === 'examen').length,
    };
    const contentsParStatut = {
      brouillon: allContents.data.filter((c) => c.statut === 'brouillon').length,
      valide:    allContents.data.filter((c) => c.statut === 'valide').length,
    };

    // Quiz
    const allQuizzes = this.quizService.findAll();
    const quizzesParStatut = {
      brouillon: allQuizzes.filter((q) => q.statut === 'brouillon').length,
      valide:    allQuizzes.filter((q) => q.statut === 'valide').length,
    };

    // Générations IA
    const generationStats = this.generationsService.getStats();

    return {
      users: {
        total: users.length,
        admins,
        enseignants,
        actifs,
      },
      matieres: {
        total: matieres.length,
      },
      promotions: {
        total: promotions.length,
      },
      archives: {
        total: archives.total,
      },
      // Alias pour compatibilité avec adminApi.js frontend
      contenus: {
        total:     allContents.total,
        parType:   contentsParType,
        parStatut: contentsParStatut,
      },
      quiz: {
        total:     allQuizzes.length,
        parStatut: quizzesParStatut,
      },
      generations: {
        total:      generationStats.total,
        thisMonth:  generationStats.thisMonth,
        byType:     generationStats.byType,
      },
    };
  }
}
