const express = require('express');
const router = express.Router();
const { Company } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/companies - Create company (requires auth)
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const { name, slug, website, logoUrl, description, tags } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ error: 'Name and slug are required' });
        }

        // Check if slug already exists
        const existing = await Company.findOne({ slug });
        if (existing) {
            return res.status(409).json({ error: 'Company with this slug already exists' });
        }

        const company = new Company({
            name,
            slug,
            website,
            logoUrl,
            description,
            tags: tags || [],
            employees: [req.user._id],
        });

        await company.save();
        res.status(201).json({ company });
    } catch (err) {
        next(err);
    }
});

// GET /api/companies - Get companies list
router.get('/', async (req, res, next) => {
    try {
        const { limit = 20, skip = 0, tag, search } = req.query;

        const filter = {};
        if (tag) filter.tags = tag;
        if (search) filter.name = { $regex: search, $options: 'i' };

        const companies = await Company.find(filter)
            .populate('employees', 'username displayName avatarUrl')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        res.json({ companies, count: companies.length });
    } catch (err) {
        next(err);
    }
});

// GET /api/companies/:slug - Get company by slug
router.get('/:slug', async (req, res, next) => {
    try {
        const company = await Company.findOne({ slug: req.params.slug })
            .populate('employees', 'username displayName avatarUrl verified');

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json({ company });
    } catch (err) {
        next(err);
    }
});

// PUT /api/companies/:id - Update company (requires auth, employee only)
router.put('/:id', authMiddleware, async (req, res, next) => {
    try {
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Check if user is an employee
        const isEmployee = company.employees.some((emp) => emp.toString() === req.user._id.toString());
        if (!isEmployee) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const updates = {};
        ['name', 'website', 'logoUrl', 'description', 'tags'].forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        Object.assign(company, updates);
        await company.save();

        res.json({ company });
    } catch (err) {
        next(err);
    }
});

// GET /api/companies/trending - Get trending companies
router.get('/trending/list', async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;

        // For now, return most recently created companies
        // In production, implement proper trending algorithm
        const companies = await Company.find()
            .populate('employees', 'username displayName avatarUrl')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({ companies });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
