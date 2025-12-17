const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const meetingService = require('../services/meetingService');

router.post('/', authMiddleware, meetingService.createMeeting);
router.get('/', authMiddleware, meetingService.listMeetings);
router.get('/:id', authMiddleware, meetingService.getMeeting);
router.get('/:id/agora-token', authMiddleware, meetingService.getAgoraToken);
router.put('/:id', authMiddleware, meetingService.updateMeeting);
router.delete('/:id', authMiddleware, meetingService.cancelMeeting);
router.post('/:id/rsvp', authMiddleware, meetingService.rsvp);
router.post('/:id/add-participant', authMiddleware, meetingService.addParticipant);

module.exports = router;
