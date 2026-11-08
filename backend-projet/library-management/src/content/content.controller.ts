import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ContentService } from './content.service.js';
import { CreateContentDto } from './dto/create-content.dto.js';
import { UpdateContentDto } from './dto/update-content.dto.js';
import { FilterContentDto } from './dto/filter-content.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('contents')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // POST /contents
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateContentDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.contentService.create({ ...dto, auteurId: user.id });
  }

  // GET /contents?type=cours&matiere=Info&page=1&limit=10
  @Get()
  findAll(@Query() filters: FilterContentDto) {
    return this.contentService.findAll(filters);
  }

  // GET /contents/public
  @Get('public')
  findPublic(@Query() filters: FilterContentDto) {
    return this.contentService.findPublic(filters);
  }

  // GET /contents/mes-contenus — contenus de l'utilisateur connecté
  @Get('mes-contenus')
  findMiens(
    @CurrentUser() user: { id: number },
    @Query() filters: FilterContentDto,
  ) {
    return this.contentService.findByAuteur(user.id, filters);
  }

  // POST /contents/:id/fichier — conserve le PDF / Word d'origine
  @Post(':id/fichier')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('fichier', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'contenus');
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname).toLowerCase());
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 Mo max
      fileFilter: (_req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx'];
        if (allowed.includes(extname(file.originalname).toLowerCase())) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Seuls PDF et Word sont acceptés'), false);
        }
      },
    }),
  )
  uploadFichier(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: number },
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.contentService.attachFile(+id, user.id, file);
  }

  // GET /contents/:id/fichier — télécharger le fichier d'origine
  @Get(':id/fichier')
  downloadFichier(@Param('id') id: string, @Res() res: Response) {
    const { chemin, nom } = this.contentService.getFile(+id);
    res.download(chemin, nom);
  }

  // GET /contents/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentService.findOne(+id);
  }

  // PATCH /contents/:id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.contentService.update(+id, user.id, dto);
  }

  // DELETE /contents/:id
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: number },
  ) {
    return this.contentService.remove(+id, user.id);
  }

  // PATCH /contents/:id/valider
  @Patch(':id/valider')
  valider(
    @Param('id') id: string,
    @CurrentUser() user: { id: number },
  ) {
    return this.contentService.valider(+id, user.id);
  }

  // PATCH /contents/:id/visibilite
  @Patch(':id/visibilite')
  toggleVisibilite(
    @Param('id') id: string,
    @CurrentUser() user: { id: number },
  ) {
    return this.contentService.toggleVisibilite(+id, user.id);
  }

  // POST /contents/:id/dupliquer
  @Post(':id/dupliquer')
  @HttpCode(HttpStatus.CREATED)
  dupliquer(
    @Param('id') id: string,
    @CurrentUser() user: { id: number },
  ) {
    return this.contentService.dupliquer(+id, user.id);
  }

  // ─────────────────────────────────────────────────────
  // ARCHIVAGE
  // ─────────────────────────────────────────────────────

  // GET /contents/archived/list — contenus archivés de l'utilisateur
  @Get('archived/list')
  findArchived(
    @CurrentUser() user: { id: number },
    @Query() filters: FilterContentDto,
  ) {
    return this.contentService.findArchived(user.id, filters);
  }

  // PATCH /contents/:id/archiver
  @Patch(':id/archiver')
  archiver(
    @Param('id') id: string,
    @CurrentUser() user: { id: number },
  ) {
    return this.contentService.archiver(+id, user.id);
  }

  // PATCH /contents/:id/desarchiver
  @Patch(':id/desarchiver')
  desarchiver(
    @Param('id') id: string,
    @CurrentUser() user: { id: number },
  ) {
    return this.contentService.desarchiver(+id, user.id);
  }
}
