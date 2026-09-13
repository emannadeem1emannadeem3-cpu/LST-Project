# FIND THE DEM DATA OF SLECTED AREA AND PLOT IT ON MAP
import streamlit as st
import ee
import folium
import geopandas as gpd
import json
from streamlit_folium import st_folium

# Step 1: Connection test (Server se raabta)
try:
    ee.Initialize(project="e-learning-485414")
    print("Google Server Connected Kamyabi Se!")
except Exception:
    ee.Authenticate()
    ee.Initialize(project="e-learning-485414")
    print("Google Server Connected Kamyabi Se!")

path = r"C:\Users\USER\Desktop\pk shapefile\Adminbdy Shapefile\District_Boundary.shp"
df = gpd.read_file(path)

if df.crs is None or df.crs.to_epsg() != 4326:
    df = df.to_crs(epsg=4326)

# Districts ki list banayi aur dropdown lagaya
district_list = sorted(df['DISTRICT'].dropna().unique())
districts = st.selectbox("Select District", district_list)

if districts:
    geometry = df[df['DISTRICT'] == districts].geometry.values[0]
    ee_geometry = ee.Geometry(geometry.__geo_interface__)
    satellite_data = ee.Image('USGS/SRTMGL1_003').clip(ee_geometry)
    
    vis = {
        'min': 0,
        'max': 3000, 
        'palette': ['blue', 'green', 'yellow', 'orange', 'red']
    }
    
    centroid = geometry.centroid
    m = folium.Map(location=[centroid.y, centroid.x], zoom_start=8)
    map_id_dict = satellite_data.getMapId(vis)

    folium.raster_layers.TileLayer(
        tiles=map_id_dict['tile_fetcher'].url_format,
        attr='Google Earth Engine / NASA SRTM',
        name='DEM Data',
        overlay=True,
        control=True
    ).add_to(m)

    # SAHI LINE: map ko display karne ke liye (if block ke andar)
    st_folium(m, width=700, height=500)
st.download_button(
    label="Download DEM GeoTIFF",
    data=satellite_data.getDownloadURL({'scale': 30, 'crs': 'EPSG:4326', 'region': ee_geometry}),
    file_name=f"DEM_{districts}.tif"
)
 # ================= WATERSHED LAYER START =================
    # 2. Level 6 HydroBASINS dataset load kiya (Pakistan ke liye best size hai)

water_shed = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_6")
    # 3. Selected district ke geometry ke saath watershed ko clip kiya
clipped_watershed = water_shed.filterBounds(ee_geometry)
    # 4. Watershed layer ko map par add kiya
folium.GeoJson(
        data=json.loads(clipped_watershed.getInfo()),
        name='Watershed',
        style_function=lambda x: {'fillColor': 'blue', 'color': 'blue', 'weight': 2, 'fillOpacity': 0.3}
    ).add_to(m)