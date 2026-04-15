const Event = require('../models/Event');
const AppError = require('../utils/appError');

/**
 * Multer (multipart/form-data) does NOT parse bracket notation like
 * groupConfig[minMembers] into nested objects the way express.urlencoded does.
 * This helper normalises those flat keys back into the nested groupConfig shape
 * that the Event schema expects.
 */
const parseGroupConfig = (data) => {
  // Case 1: Already coming as object (from JSON)
  if (data.groupConfig && typeof data.groupConfig === 'object') {
    data.groupConfig.minMembers = Number(data.groupConfig.minMembers);
    data.groupConfig.maxMembers = Number(data.groupConfig.maxMembers);
    return data;
  }

  // Case 2: Coming from form-data (multer)
  const min = data['groupConfig[minMembers]'];
  const max = data['groupConfig[maxMembers]'];

  if (min !== undefined || max !== undefined) {
    data.groupConfig = {
      minMembers: min ? Number(min) : undefined,
      maxMembers: max ? Number(max) : undefined,
    };
    delete data['groupConfig[minMembers]'];
    delete data['groupConfig[maxMembers]'];
  }

  return data;
};

class EventService {
  async createEvent(organizerId, eventData, file) {
    // Cloudinary URL from the multer middleware
    if (!file) {
      throw new AppError('Cover image is required.', 400);
    }

    // Normalise groupConfig from multer flat fields or JSON
    parseGroupConfig(eventData);

    console.log("Incoming eventData:", eventData);

    if (
      eventData.eventType === "GROUP" ||
      eventData.eventType === "BOTH"
    ) {
      if (
        !eventData.groupConfig ||
        !eventData.groupConfig.minMembers ||
        !eventData.groupConfig.maxMembers
      ) {
        throw new AppError("Group config is required for group events", 400);
      }

      if (eventData.groupConfig.minMembers < 2) {
        throw new AppError("Minimum members must be at least 2", 400);
      }

      if (
        eventData.groupConfig.maxMembers <
        eventData.groupConfig.minMembers
      ) {
        throw new AppError("Max members must be >= min members", 400);
      }
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

    // Normalise groupConfig from multer flat fields
    parseGroupConfig(updateData);

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
