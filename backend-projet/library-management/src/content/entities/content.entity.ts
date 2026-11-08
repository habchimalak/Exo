export class Content {
  id: number;
  titre: string;
  type: string;
  matiere: string;
  theme: string;
  contenu: string;
  statut: string;
  visibilite: string;
  auteurId: number;
  dateCreation: Date;
  dateModification: Date;
  // Fichier original (PDF / Word) conservé sur le serveur
  fichierNom?: string;     // nom d'origine, affiché à l'utilisateur
  fichierChemin?: string;  // chemin sur le serveur (volume uploads)
  // Archivage
  archived: boolean;
  archivedAt?: Date;
}
