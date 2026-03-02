var ndviCollection = ee.ImageCollection("MODIS/061/MOD13Q1")
  .filterBounds(punjab)
  .filterDate('2024-01-01', '2024-12-31')
  .select('NDVI');

var meanNDVI = ndviCollection.mean().clip(punjab);

var vis = {
  min: 0,
  max: 8000,
  palette: ['white', 'yellow', 'green']
};

Map.centerObject(punjab, 7);
Map.addLayer(meanNDVI, vis, 'Punjab NDVI 2024');

var months = ee.List.sequence(1, 12);

var monthlyNDVI = ee.ImageCollection.fromImages(
  months.map(function(m) {
    var start = ee.Date.fromYMD(2024, m, 1);
    var end = start.advance(1, 'month');
    
    var img = ndviCollection
      .filterDate(start, end)
      .mean()
      .set('month', m);
      
    return img;
  })
);

var chart = ui.Chart.image.seriesByRegion({
  imageCollection: monthlyNDVI,
  regions: punjab,
  reducer: ee.Reducer.mean(),
  scale: 500,
  xProperty: 'month',
  seriesProperty: 'label'
}).setOptions({
  title: 'Punjab Monthly Mean NDVI 2024',
  hAxis: {title: 'Month'},
  vAxis: {title: 'NDVI'},
  lineWidth: 2,
  pointSize: 4
});

print(chart); ye code hai mera 
