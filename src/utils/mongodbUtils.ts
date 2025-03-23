

const paginationForm = (data: any[], size: number, page: number): any => {
  const paginatedData: any = data[0].paginatedData;
  const totalCount: number = data[0].totalCount.length > 0 ? data[0].totalCount[0].total : 0;

  const totalPages: number = Math.ceil(totalCount / size);

  return {
    paginatedData,
    pagination: {
      currentPage: page,
      size,
      totalPages,
      totalCount
    }
  };
}

const webSitesAggregation = (page: number, size: number): { totalCountPipeline: any[], paginatedDataPipeline: any[] } => {
  const paginatedDataPipeline = [
    { $sort: { _id: -1 } },
    { $skip: (page - 1) * size },
    { $limit: Number(size) },
    {
      $lookup: {
        from: 'web-sites', // Target collection
        localField: 'userId', // Field from the input documents
        foreignField: 'userId', // Field from the target documents
        as: 'sameOwner', // Output array field
        pipeline: [
          //{ $match: { userId : { $ne : null } }},
          { $group: { _id: '$userId', total: { $sum: 1 } } },
          { $project: { _id: 0, total: 1 } }
        ]
      }
    },
    {
      $unwind: '$sameOwner', // Deconstruct the additionalData array
    },
  ];
  const totalCountPipeline = [
    { $count: 'total' },
  ];

  return { totalCountPipeline, paginatedDataPipeline };
}

export { paginationForm, webSitesAggregation };