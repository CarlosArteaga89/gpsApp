import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {LocationInterface} from '../interfaces/location';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirestorageService {

  private locationCollection: AngularFirestoreCollection<LocationInterface>;
  private tareas: Observable<LocationInterface[]>;

  constructor(private db: AngularFirestore) {
    this.locationCollection = db.collection<LocationInterface>('ubicaciones');
    this.tareas = this.locationCollection.snapshotChanges().pipe(map(
      actions => {
        return actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return {id, ...data};
        });
      }
    ));
  }

  createLocation(tarea: LocationInterface) {
    return this.locationCollection.add(tarea);
  }

  getLocations() {
    return this.tareas;
  }

  getLocation(id: string) {
    return this.locationCollection.doc<LocationInterface>(id).valueChanges();
  }

  removeLocation(id: string ) {
    return this.locationCollection.doc(id).delete();
  }

  updateLocation( tarea: LocationInterface, id: string ) {
    return this.locationCollection.doc(id).update(tarea);
  }

  newId(){
    return this.db.createId();
  }
}
