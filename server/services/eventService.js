const Event = require('../models/Event');
const AppError = require('../utils/appError');

class EventService {
  async createEvent(organizerId, eventData, file) {
    // Cloudinary URL from the multer middleware
    if (!file) {
      throw new AppError('Cover image is required.', 400);
    }

    eventData.cover_image = file.path;
    eventData.organizer_id = organizerId;

    const newEvent = await Event.create(eventData);
    return newEvent;
  }

  async getAllEvents(query) {
    // Build query
    const queryObj = { ...query };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Handle search by title text index
    let mongooseQuery = Event.find(queryObj);
    if (query.search) {
      mongooseQuery = mongooseQuery.find({ $text: { $search: query.search } });
    }

    // Pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 10;
    const skip = (page - 1) * limit;

    mongooseQuery = mongooseQuery.skip(skip).limit(limit).populate({
      path: 'organizer_id',
      select: 'name email',
    });

    // Execute query (leaning to optimize read queries)
    const events = await mongooseQuery.lean();
    
    // Count total pages
    let totalQuery = Event.countDocuments(queryObj);
    if (query.search) {
      totalQuery = Event.countDocuments({ ...queryObj, $text: { $search: query.search }});
    }
    const totalEvents = await totalQuery;
    const totalPages = Math.ceil(totalEvents / limit);

    return { events, totalPages, currentPage: page };
  }

  async getEventById(eventId) {
    const event = await Event.findById(eventId).populate({
      path: 'organizer_id',
      select: 'name email',
    });

    if (!event) {
      throw new AppError('No event found with that ID', 404);
    }

    return event;
  }

  async updateEvent(eventId, organizerId, updateData, file) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new AppError('No event found with that ID', 404);
    }

    if (event.organizer_id.toString() !== organizerId.toString()) {
      throw new AppError('You do not have permission to update this event', 403);
    }

    if (file) {
      updateData.cover_image = file.path;
    }

    const updatedEvent = await Event.findByIdAndUpdate(eventId, updateData, {
      new: true,
      runValidators: true,
    });

    return updatedEvent;
  }

  async deleteEvent(eventId, organizerId) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new AppError('No event found with that ID', 404);
    }

    if (event.organizer_id.toString() !== organizerId.toString()) {
      throw new AppError('You do not have permission to delete this event', 403);
    }

    await Event.findByIdAndDelete(eventId);
  }
}

module.exports = new EventService();
