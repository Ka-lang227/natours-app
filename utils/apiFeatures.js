class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\"gte\"/g, '"$gte"');
    queryStr = queryStr.replace(/\"gt\"/g, '"$gt"');
    queryStr = queryStr.replace(/\"lte\"/g, '"$lte"');
    queryStr = queryStr.replace(/\"lt\"/g, '"$lt"');
    
    const parsedFilter = JSON.parse(queryStr);

    this.query = this.query.find(parsedFilter);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt'); // Default sorting by createdAt in descending order
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // Exclude __v field by default
    } 
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; // Convert to number
    const limit = this.queryString.limit * 1 || 100; // Convert to number
    const skip = (page - 1) * limit; // Calculate the number of documents to skip

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
