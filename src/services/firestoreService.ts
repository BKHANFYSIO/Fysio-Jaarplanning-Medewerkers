import { collection, writeBatch, doc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import Papa from 'papaparse';
import { db } from '../firebase'; // Make sure you have this file exporting your db instance
import { PlanningItem } from '../types';

/**
 * Overwrites all documents in a specific collection with new data.
 * This is useful for importing data from a CSV file.
 * The data is written in batches to avoid exceeding Firestore limits.
 * 
 * @param collectionName The name of the collection to overwrite.
 * @param data An array of objects to write to the collection.
 */
export const bulkOverwrite = async (collectionName: string, data: PlanningItem[]) => {
  if (!data) {
    console.log('No data provided to bulk overwrite. Skipping.');
    return;
  }

  const collectionRef = collection(db, collectionName);

  // 1. Delete all existing documents in the collection
  const existingDocsSnapshot = await getDocs(collectionRef);
  const deleteBatch = writeBatch(db);
  existingDocsSnapshot.forEach(doc => {
    deleteBatch.delete(doc.ref);
  });
  await deleteBatch.commit();
  console.log(`Successfully deleted ${existingDocsSnapshot.size} old documents from ${collectionName}.`);

  // 2. Write the new documents
  if (data.length === 0) {
    console.log('Data array is empty. Collection is now cleared.');
    return;
  }
  
  const batchSize = 500; // Firestore batch limit
  let addBatch = writeBatch(db);
  let count = 0;

  // Note: This function doesn't delete old documents. 
  // For a true overwrite, you would first need to delete all existing documents.
  // For this use case, we assume we are replacing the entire dataset.

  for (const item of data) {
    const docRef = doc(collectionRef); // Creates a new doc with a unique ID
    addBatch.set(docRef, item);
    count++;

    if (count === batchSize) {
      // Commit the batch and start a new one
      await addBatch.commit();
      addBatch = writeBatch(db);
      count = 0;
    }
  }

  // Commit the final batch if it has any writes
  if (count > 0) {
    await addBatch.commit();
  }

  console.log(`Successfully wrote ${data.length} new documents to ${collectionName}.`);
};

/**
 * Deletes a single document from a specified Firestore collection.
 * @param collectionName The name of the collection.
 * @param documentId The ID of the document to delete.
 */
export const deleteItem = async (collectionName: string, documentId: string) => {
  const docRef = doc(db, collectionName, documentId);
  await deleteDoc(docRef);
  console.log(`Document with ID ${documentId} successfully deleted from ${collectionName}.`);
};

/**
 * Updates a single document in a specified Firestore collection.
 * @param collectionName The name of the collection.
 * @param documentId The ID of the document to update.
 * @param data The new data for the document.
 */
export const updateItem = async (collectionName: string, documentId: string, data: Partial<PlanningItem>) => {
  const docRef = doc(db, collectionName, documentId);
  await updateDoc(docRef, data);
  console.log(`Document with ID ${documentId} successfully updated in ${collectionName}.`);
};

/**
 * Fetches all documents from a collection and triggers a browser download as a CSV file.
 * @param collectionName The name of the Firestore collection to export.
 * @param fileName The desired name for the downloaded CSV file.
 */
export const fetchAndExportAsCsv = async (collectionName:string, fileName: string) => {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  
  if (snapshot.empty) {
    alert('De collectie is leeg. Er is niets om te exporteren.');
    return;
  }

  const data = snapshot.docs.map(doc => doc.data() as PlanningItem);

  // Remap data to match the expected CSV headers
  const csvData = data.map(item => ({
    'Titel (of wat)': item.title,
    'Extra regel': item.description,
    'link': item.link,
    'Waarderen': item.subjects.waarderen ? 'v' : '',
    'Juniorstage': item.subjects.juniorstage ? 'v' : '',
    'IPL': item.subjects.ipl ? 'v' : '',
    'BVP': item.subjects.bvp ? 'v' : '',
    'PZW': item.subjects.pzw ? 'v' : '',
    'Minor': item.subjects.minor ? 'v' : '',
    'Getuigschriften': item.subjects.getuigschriften ? 'v' : '',
    'Inschrijven/aanmelden': item.subjects.inschrijven ? 'v' : '',
    'Overig': item.subjects.overig ? 'v' : '',
    'Startdatum': item.startDate,
    'Einddatum': item.endDate,
    'Tijd startdatum': item.startTime,
    'Tijd einddatum': item.endTime,
    'Deadline': item.deadline,
    'Wie?': '', // Placeholder, add if needed
    'P': item.phases.p ? 'v' : '',
    'H1': item.phases.h1 ? 'v' : '',
    'H2/3': item.phases.h2h3 ? 'v' : '',
  }));

  const csvString = Papa.unparse(csvData);

  // Trigger download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
