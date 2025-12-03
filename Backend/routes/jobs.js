const express = require('express');
const router = express.Router();
const { Job, Notification } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/jobs - Create job posting
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const {
            title,
            company,
            description,
            location,
            type,
            sector,
            experienceLevel,
            salary,
            currency,
            skills,
        } = req.body;

        if (!title || !company || !description || !location || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const job = new Job({
            postedBy: req.user._id,
            title,
            company,
            description,
            location,
            type,
            sector,
            experienceLevel,
            salary,
            currency,
            skills: skills || [],
        });

        await job.save();
        await job.populate('postedBy', 'username displayName avatarUrl verified');

        res.status(201).json({ job });
    } catch (err) {
        next(err);
    }
});

// GET /api/jobs - Get job listings with filters
router.get('/', async (req, res, next) => {
    try {
        const {
            limit = 20,
            skip = 0,
            sector,
            location,
            type,
            experienceLevel,
            search,
            postedBy,
        } = req.query;

        const filter = { status: 'active' };

        if (sector) filter.sector = sector;
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (type) filter.type = type;
        if (experienceLevel) filter.experienceLevel = experienceLevel;
        if (postedBy) filter.postedBy = postedBy;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const jobs = await Job.find(filter)
            .populate('postedBy', 'username displayName avatarUrl verified')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Job.countDocuments(filter);

        res.json({ jobs, count: jobs.length, total });
    } catch (err) {
        next(err);
    }
});

// GET /api/jobs/:id - Get job details
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id)
            .populate('postedBy', 'username displayName avatarUrl verified')
            .populate('applicants.userId', 'username displayName avatarUrl verified');

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // If user is not the job poster, hide applicant details
        const isOwner = req.user && job.postedBy._id.toString() === req.user._id.toString();
        const jobData = job.toObject();

        if (!isOwner) {
            jobData.applicants = jobData.applicants.length; // Just show count
        }

        res.json({ job: jobData, isOwner });
    } catch (err) {
        next(err);
    }
});

// PUT /api/jobs/:id - Update job
router.put('/:id', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Update allowed fields
        const allowedUpdates = [
            'title',
            'company',
            'description',
            'location',
            'type',
            'sector',
            'experienceLevel',
            'salary',
            'currency',
            'skills',
            'status',
        ];

        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                job[field] = updates[field];
            }
        });

        await job.save();
        await job.populate('postedBy', 'username displayName avatarUrl verified');

        res.json({ job });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/jobs/:id - Delete job
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await job.deleteOne();

        res.json({ message: 'Job deleted successfully' });
    } catch (err) {
        next(err);
    }
});

// POST /api/jobs/:id/apply - Apply to job
router.post('/:id/apply', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { coverLetter, resumeUrl } = req.body;

        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.status !== 'active') {
            return res.status(400).json({ error: 'Job is not accepting applications' });
        }

        // Check if already applied
        const alreadyApplied = job.applicants.some(
            app => app.userId.toString() === req.user._id.toString()
        );

        if (alreadyApplied) {
            return res.status(400).json({ error: 'Already applied to this job' });
        }

        // Add applicant
        job.applicants.push({
            userId: req.user._id,
            coverLetter,
            resumeUrl,
            appliedAt: new Date(),
        });

        await job.save();

        // Create notification for job poster
        const notification = new Notification({
            user: job.postedBy,
            actor: req.user._id,
            type: 'job_application',
            payload: {
                jobId: job._id,
                jobTitle: job.title,
            },
        });
        await notification.save();

        res.json({ message: 'Application submitted successfully' });
    } catch (err) {
        next(err);
    }
});

// GET /api/jobs/:id/applicants - Get job applicants (job owner only)
router.get('/:id/applicants', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id).populate(
            'applicants.userId',
            'username displayName avatarUrl verified bio'
        );

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ applicants: job.applicants });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
