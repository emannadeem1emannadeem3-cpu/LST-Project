var pun = ee.FeatureCollection('projects/e-learning-485414/assets/punjab');

// 1. MODIS LST dataset load karein
var lst = ee.ImageCollection('MODIS/061/MOD11A2')
  .select('LST_Day_1km')
  .filterBounds(pun)
  .filterDate('2015-01-01', '2025-12-31');

// 2. Saalon ki list banayein (2015 se 2024 tak)
var years = ee.List.sequence(2015, 2024);

// 3. Har saal ka 1 average image banayein
var yearlyLST = ee.ImageCollection.fromImages(
  years.map(function(y) {
    var annualMean = lst.filter(ee.Filter.calendarRange(y, y, 'year'))
                        .mean() // Poore saal ka average
                        .set('year', y)
                        .set('system:time_start', ee.Date.fromYMD(y, 1, 1).millis());
    return annualMean;
  })
);

// 4. Celsius mein convert karein aur Region ka mean nikalein
var finalCollection = yearlyLST.map(function(img) {
  var temp = img.multiply(0.02).subtract(273.15);
  
  var stats = temp.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: pun,
    scale: 1000,
    bestEffort: true
  });
  
  return ee.Feature(null, {
    'LST': stats.get('LST_Day_1km'),
    'year': img.get('year'),
    'system:time_start': img.get('system:time_start')
  });
}).filter(ee.Filter.notNull(['LST']));

// 5. Chart banayein (Ab har saal ka sirf 1 point hoga)
var chart = ui.Chart.feature.byFeature(finalCollection, 'year', 'LST')
  .setChartType('LineChart')
  .setOptions({
    title: 'Punjab Annual Mean Temperature (2015-2025)',
    hAxis: {
      title: 'Year',
      format: '####', // Taaki saal simple number mein dikhayi de
      gridlines: {count: 10}
    },
    vAxis: {title: 'Temperature (°C)'},
    lineWidth: 2,
    pointSize: 4, // Har saal ka point wazay dikhega
    series: {0: {color: 'red'}}
  });

print(chart);
