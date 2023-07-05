import React, { useState, useEffect } from 'react';
import { Popover, OverlayTrigger } from 'react-bootstrap';

function PlaceInfo(props) {
  const [placeInfo, setPlaceInfo] = useState(null);

  useEffect(() => {
    async function fetchPlaceInfo() {
      const response = await fetch(`https://cors-anywhere.herokuapp.com/https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles=${props.place}`);
      const data = await response.json();
      setPlaceInfo(data.query.pages[Object.keys(data.query.pages)[0]].extract);
    }
    fetchPlaceInfo();
  }, [props.place]);

  return (
    <div>
      {placeInfo && (
        <Popover>
            <Popover.Content>
            {placeInfo}
            </Popover.Content>
        </Popover>
      )}
    </div>
  );
}

export function AppWikiHover() {
  const [selectedPlace, setSelectedPlace] = useState(null);

  return (
    <div style={{color: 'white'}}>
      <h1>Places</h1>
      <ul>
        <li onMouseEnter={() => setSelectedPlace('San Francisco')} onMouseLeave={() => setSelectedPlace(null)}>San Francisco</li>
        <li onMouseEnter={() => setSelectedPlace('New York')} onMouseLeave={() => setSelectedPlace(null)}>New York</li>
        <li onMouseEnter={() => setSelectedPlace('Los Angeles')} onMouseLeave={() => setSelectedPlace(null)}>Los Angeles</li>
      </ul>
      {selectedPlace && (
        <OverlayTrigger
          trigger="hover"
          placement="right"
          overlay={
            <PlaceInfo place={selectedPlace} />
          }
        >
          <span style={{display: 'none'}}>{selectedPlace}</span>
        </OverlayTrigger>
      )}
    </div>
  );
}
