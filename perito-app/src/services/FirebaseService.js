/**
 * Firebase Service
 * Perito App - Servicios Firebase
 */

import { db, auth, storage } from '../config/firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

class FirebaseService {
  
  // Método para subir archivos (imágenes, documentos)
  static async uploadFile(file, path) {
    try {
      const fileRef = ref(storage, path);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Métodos para Firestore
  static async addDocument(collectionName, data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  static async getDocuments(collectionName, filters = null) {
    try {
      let q = collection(db, collectionName);
      
      if (filters) {
        q = query(q, ...filters);
      }
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return documents;
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  static async updateDocument(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  static async deleteDocument(collectionName, docId) {
    try {
      await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Métodos específicos para la app
  static async syncAsignaciones(asignaciones) {
    try {
      const promises = asignaciones.map(asignacion => 
        this.addDocument('asignaciones', asignacion)
      );
      await Promise.all(promises);
      console.log('Asignaciones sincronizadas exitosamente');
    } catch (error) {
      console.error('Error syncing asignaciones:', error);
      throw error;
    }
  }

  static async syncFormularios(formularios) {
    try {
      const promises = formularios.map(formulario => 
        this.addDocument('formularios', formulario)
      );
      await Promise.all(promises);
      console.log('Formularios sincronizados exitosamente');
    } catch (error) {
      console.error('Error syncing formularios:', error);
      throw error;
    }
  }
}

export { FirebaseService };