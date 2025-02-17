import { Request, Response } from 'express';
import Event from '../models/Event'; // Assurez-vous que le modèle Event est défini

// Récupérer tous les événements
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const events = await Event.find(); // Récupérer tous les événements
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer un événement par ID
export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id); // Récupérer l'événement par ID
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Créer un nouvel événement
export const createEvent = async (req: Request, res: Response) => {
  const event = new Event(req.body); // Créer un nouvel événement à partir des données de la requête
  try {
    const savedEvent = await event.save(); // Sauvegarder l'événement
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mettre à jour un événement existant
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true }); // Mettre à jour l'événement
    if (!updatedEvent) return res.status(404).json({ message: 'Événement non trouvé' });
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer un événement
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id); // Supprimer l'événement
    if (!deletedEvent) return res.status(404).json({ message: 'Événement non trouvé' });
    res.json({ message: 'Événement supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};