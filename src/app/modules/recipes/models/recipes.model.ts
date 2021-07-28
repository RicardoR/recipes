import { DocumentChange, DocumentChangeType } from "@angular/fire/firestore/interfaces";

export interface Recipe {
  date: Date,
  description: string,
  title: string,
}
