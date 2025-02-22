
const paginate = async (model: any, page: number, limit: number) => {
        const skip = (page - 1) * limit

        const totalItems = await model.countDocuments()
        const totalPages = Math.ceil(totalItems / limit);

        if (page > totalPages) {
            return {
              data: [],
              pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                perPage: limit,
                hasNextPage: false,
                hasPrevPage: page > 1,
              },
            };
          }
        const results = model.find().skip(skip).limit(limit)
    
        return {
            data: results,
            pagination: {
              totalItems,
              totalPages,
              currentPage: page,
              perPage: limit,
              hasNextPage: page < totalPages,
              hasPrevPage: page > 1,
            },
          };
}
    
export default paginate