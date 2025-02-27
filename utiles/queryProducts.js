class QueryProducts {
  constructor(query) {
    this.query = query;
    this.mongoQuery = {}; // MongoDB query object
    this.sortOption = {};
  }

  categoryQuery() {
    if (this.query.category) {
      this.mongoQuery.category = this.query.category;
    }
    return this;
  }

  ratingQuery() {
    if (this.query.rating) {
      const rating = parseInt(this.query.rating);
      this.mongoQuery.rating = { $gte: rating, $lt: rating + 1 };
    }
    return this;
  }

  priceQuery() {
    if (this.query.lowPrice && this.query.highPrice) {
      this.mongoQuery.price = {
        $gte: parseFloat(this.query.lowPrice),
        $lte: parseFloat(this.query.highPrice),
      };
    }
    return this;
  }

  searchQuery() {
    if (this.query.searchValue) {
      this.mongoQuery.name = {
        $regex: new RegExp(this.query.searchValue, "i"), // Case-insensitive search
      };
    }
    return this;
  }

  sortByPrice() {
    if (this.query.sortPrice === "low-to-high") {
      this.sortOption.price = 1; // Ascending
    } else if (this.query.sortPrice === "high-to-low") {
      this.sortOption.price = -1; // Descending
    }
    return this;
  }

  async getProducts(model) {
    const pageNumber = parseInt(this.query.pageNumber) || 1;
    const parPage = parseInt(this.query.parPage) || 10;
    const skip = (pageNumber - 1) * parPage;

    const products = await model
      .find(this.mongoQuery)
      .sort(this.sortOption)
      .skip(skip)
      .limit(parPage);

    const totalProducts = await model.countDocuments(this.mongoQuery);
    return { products, totalProducts };
  }
}

module.exports = QueryProducts;
