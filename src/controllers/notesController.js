import { Note } from '../models/note.js';
import createHttpError from 'http-errors';

export const getAllNotes = async (req, res) => {
  const { tag, search, page = 1, perPage = 12 } = req.query;

  // Створюємо базовий запит з обов'язковим фільтром userId
  let query = Note.find().where('userId').equals(req.user._id);
  let countQuery = Note.find().where('userId').equals(req.user._id);

  // Фільтрування за тегом
  if (tag) {
    query = query.where('tag').equals(tag);
    countQuery = countQuery.where('tag').equals(tag);
  }

  // Текстовий пошук по title та content
  if (search) {
    query = query.where('$text').equals({ $search: search });
    countQuery = countQuery.where('$text').equals({ $search: search });
  }

  const skip = (page - 1) * perPage;

  // Виконуємо одразу два запити паралельно
  const [totalNotes, notes] = await Promise.all([
    countQuery.countDocuments(),
    query.skip(skip).limit(perPage),
  ]);

  // Обчислюємо загальну кількість «сторінок»
  const totalPages = Math.ceil(totalNotes / perPage);

  res.status(200).json({
    page: Number(page),
    perPage: Number(perPage),
    totalNotes,
    totalPages,
    notes,
  });
};

export const createNote = async (req, res) => {
  const note = await Note.create({
    ...req.body,
    userId: req.user._id,
  });

  res.status(201).json(note);
};

export const getNoteById = async (req, res, next) => {
  const { noteId } = req.params;
  const note = await Note.findOne({
    _id: noteId,
    userId: req.user._id,
  });

  if (!note) {
    throw createHttpError(404, 'Note not found');
  }

  res.status(200).json(note);
};

export const deleteNote = async (req, res, next) => {
  const { noteId } = req.params;
  const note = await Note.findOneAndDelete({
    _id: noteId,
    userId: req.user._id,
  });

  if (!note) {
    throw createHttpError(404, 'Note not found');
  }

  res.status(200).json(note);
};

export const updateNote = async (req, res, next) => {
  const { noteId } = req.params;

  const note = await Note.findOneAndUpdate(
    { _id: noteId, userId: req.user._id },
    req.body,
    { new: true },
  );

  if (!note) {
    throw createHttpError(404, 'Note not found');
  }

  res.status(200).json(note);
};
