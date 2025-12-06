const { Job, Notification } = require('../models');

exports.createJob = async (req, res, next) => {
    try {
        const { title, sector, locationType, employmentType, compensation, requirements, customQuestions } = req.body;
        if (!title || !requirements) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const job = new Job({
            poster: req.user._id,
            title,
            sector,
            locationType,
            employmentType,
            compensation,
            requirements,
            customQuestions: customQuestions || [],
        });
        await job.save();
        await job.populate('poster', 'username displayName avatarUrl verified');
        res.status(201).json({ job });
    } catch (err) {
        next(err);
    }
};

exports.listJobs = async (req, res, next) => {
    try {
        const { limit = 20, skip = 0, sector, locationType, employmentType, search, poster } = req.query;
        const filter = {};
        if (sector) filter.sector = sector;
        if (locationType) filter.locationType = { $regex: locationType, $options: 'i' };
        if (employmentType) filter.employmentType = employmentType;
        if (poster) filter.poster = poster;
        if (search) filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { requirements: { $regex: search, $options: 'i' } }
        ];
        const jobs = await Job.find(filter)
            .populate('poster', 'username displayName avatarUrl verified')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));
        const total = await Job.countDocuments(filter);

        res.json({ jobs, count: jobs.length, total });
    } catch (err) {
        next(err);
    }
};

exports.getJob = async (req, res, next) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id)
            .populate('postedBy', 'username displayName avatarUrl verified')
            .populate('applicants.userId', 'username displayName avatarUrl verified');

        if (!job) return res.status(404).json({ error: 'Job not found' });

        const isOwner = req.user && job.postedBy._id.toString() === req.user._id.toString();
        const jobData = job.toObject();
        if (!isOwner) jobData.applicants = jobData.applicants.length;

        res.json({ job: jobData, isOwner });
    } catch (err) {
        next(err);
    }
};

exports.updateJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const job = await Job.findById(id);
        if (!job) return res.status(404).json({ error: 'Job not found' });
        if (job.postedBy.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Access denied' });

        const allowedUpdates = ['title', 'company', 'description', 'location', 'type', 'sector', 'experienceLevel', 'salary', 'currency', 'skills', 'status'];
        allowedUpdates.forEach(field => { if (updates[field] !== undefined) job[field] = updates[field]; });

        await job.save();
        await job.populate('postedBy', 'username displayName avatarUrl verified');

        res.json({ job });
    } catch (err) {
        next(err);
    }
};

exports.deleteJob = async (req, res, next) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id);
        if (!job) return res.status(404).json({ error: 'Job not found' });
        if (job.postedBy.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Access denied' });

        await job.deleteOne();
        res.json({ message: 'Job deleted successfully' });
    } catch (err) {
        next(err);
    }
};

exports.applyToJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { coverLetter, resumeUrl } = req.body;

        const job = await Job.findById(id);
        if (!job) return res.status(404).json({ error: 'Job not found' });
        if (job.status !== 'active') return res.status(400).json({ error: 'Job is not accepting applications' });

        const alreadyApplied = job.applicants.some(app => app.userId.toString() === req.user._id.toString());
        if (alreadyApplied) return res.status(400).json({ error: 'Already applied to this job' });

        job.applicants.push({ userId: req.user._id, coverLetter, resumeUrl, appliedAt: new Date() });
        await job.save();

        const notification = new Notification({ user: job.postedBy, actor: req.user._id, type: 'job_application', payload: { jobId: job._id, jobTitle: job.title } });
        await notification.save();

        res.json({ message: 'Application submitted successfully' });
    } catch (err) {
        next(err);
    }
};

exports.getApplicants = async (req, res, next) => {
    try {
        const { id } = req.params;
        const job = await Job.findById(id).populate('applicants.userId', 'username displayName avatarUrl verified');
        if (!job) return res.status(404).json({ error: 'Job not found' });
        if (job.postedBy.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Access denied' });

        res.json({ applicants: job.applicants });
    } catch (err) {
        next(err);
    }
};
