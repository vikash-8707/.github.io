"""
Alternative implementation using PyDeck (Deck.gl for Python)
Useful for Jupyter Notebooks, Streamlit, and Pandas DataFrames.
"""

import os
import pydeck as pdk
import pandas as pd

def generate_pydeck_3d_map(output_filename="pydeck_map.html"):
    # Create DataFrame with landmark data
    data = pd.DataFrame([
        {"id": 1, "name": "1  Tower Bridge", "lat": 51.5055, "lon": -0.0754},
        {"id": 2, "name": "2  Tower of London", "lat": 51.5081, "lon": -0.0759},
        {"id": 3, "name": "3  HMS Belfast", "lat": 51.5066, "lon": -0.0814},
        {"id": 4, "name": "4  City Hall", "lat": 51.5048, "lon": -0.0790},
        {"id": 5, "name": "5  St. Katharine Docks", "lat": 51.5075, "lon": -0.0710},
    ])

    # Text Layer for labels and numbers
    text_layer = pdk.Layer(
        "TextLayer",
        data=data,
        get_position=["lon", "lat"],
        get_text="name",
        get_size=15,
        get_color=[20, 20, 20, 255],
        get_angle=0,
        get_text_anchor="'start'",
        get_alignment_baseline="'center'",
        background=True,
        get_background_color=[255, 255, 255, 240],
        background_padding=[8, 5, 8, 5],
        pickable=True,
    )

    # 3D View perspective (Pitch tilts into 3D, Bearing rotates)
    view_state = pdk.ViewState(
        latitude=51.5060,
        longitude=-0.0765,
        zoom=15.3,
        pitch=58,
        bearing=-30,
    )

    deck = pdk.Deck(
        layers=[text_layer],
        initial_view_state=view_state,
        map_style="https://tiles.openfreemap.org/styles/liberty", # Free OpenMapTiles with 3D buildings
        tooltip={"text": "{name}"}
    )

    deck.to_html(output_filename)
    print(f"✅ PyDeck 3D Map generated at: {os.path.abspath(output_filename)}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, "pydeck_map.html")
    generate_pydeck_3d_map(output_filename=output_path)
