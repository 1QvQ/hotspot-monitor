import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// Get all keywords
router.get('/', async (req, res) => {
  try {
    const keywords = await prisma.keyword.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { hotspots: true }
        }
      }
    });
    res.json(keywords);
  } catch (error) {
    console.error('Error fetching keywords:', error);
    res.status(500).json({ error: 'Failed to fetch keywords' });
  }
});

// Get a single keyword
router.get('/:id', async (req, res) => {
  try {
    const keyword = await prisma.keyword.findUnique({
      where: { id: req.params.id },
      include: {
        hotspots: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!keyword) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    res.json(keyword);
  } catch (error) {
    console.error('Error fetching keyword:', error);
    res.status(500).json({ error: 'Failed to fetch keyword' });
  }
});

// Create a keyword
router.post('/', async (req, res) => {
  try {
    const { text, category } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Keyword text is required' });
    }

    const keyword = await prisma.keyword.create({
      data: {
        text: text.trim(),
        category: category?.trim() || null
      }
    });

    res.status(201).json(keyword);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Keyword already exists' });
    }
    console.error('Error creating keyword:', error);
    res.status(500).json({ error: 'Failed to create keyword' });
  }
});

// Update a keyword
router.put('/:id', async (req, res) => {
  try {
    const { text, category, isActive } = req.body;

    const keyword = await prisma.keyword.update({
      where: { id: req.params.id },
      data: {
        ...(text && { text: text.trim() }),
        ...(category !== undefined && { category: category?.trim() || null }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json(keyword);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Keyword not found' });
    }
    console.error('Error updating keyword:', error);
    res.status(500).json({ error: 'Failed to update keyword' });
  }
});

// Delete a keyword
router.delete('/:id', async (req, res) => {
  try {
    await prisma.keyword.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Keyword not found' });
    }
    console.error('Error deleting keyword:', error);
    res.status(500).json({ error: 'Failed to delete keyword' });
  }
});

// Toggle keyword status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const keyword = await prisma.keyword.findUnique({
      where: { id: req.params.id }
    });

    if (!keyword) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    const updated = await prisma.keyword.update({
      where: { id: req.params.id },
      data: { isActive: !keyword.isActive }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error toggling keyword:', error);
    res.status(500).json({ error: 'Failed to toggle keyword' });
  }
});

export default router;
