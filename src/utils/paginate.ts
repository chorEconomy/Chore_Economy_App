const paginate = async (
    model: any, 
    page: number, 
    limit: number, 
    populateField: string = "", 
    query: any = {}
  ) => {
      const skip = (page - 1) * limit;
  
      // Count only the matching documents
      const totalItems = await model.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);
  
      // Prevent unnecessary query execution if page exceeds total pages
      if (page > totalPages && totalItems > 0) {
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
  
      // Fetch paginated results
      const results = await model
          .find(query)
          .skip(skip)
          .limit(limit)
          .populate(populateField);
  
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
  };
  
  export default paginate;
  