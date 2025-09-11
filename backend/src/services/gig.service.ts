import Gig from '../models/Gig';

export const findGigsByTeacher = async (teacherId: string) => {
  return await Gig.find({ teacher: teacherId });
};

export const findGigById = async (gigId: string) => {
  return await Gig.findById(gigId).populate('teacher', 'name email');
};

export const createGig = async (gigData: any) => {
  return await Gig.create(gigData);
};

export const updateGig = async (gigId: string, updateData: any) => {
  return await Gig.findByIdAndUpdate(gigId, updateData, {
    new: true,
    runValidators: true,
  });
};

export const searchGigs = async (query: any) => {
  const { category, priceMin, priceMax, ...rest } = query;
  
  let searchQuery: any = { ...rest };
  
  if (category) {
    searchQuery.category = category;
  }
  
  if (priceMin || priceMax) {
    searchQuery.price = {};
    if (priceMin) searchQuery.price.$gte = priceMin;
    if (priceMax) searchQuery.price.$lte = priceMax;
  }
  
  return await Gig.find(searchQuery).populate('teacher', 'name email');
};
