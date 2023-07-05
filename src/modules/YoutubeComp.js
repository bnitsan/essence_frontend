import React from 'react';
import PropTypes from "prop-types";
import './App.css';

const YoutubeEmbed = ({ embedId, login_jwt, new_user }) => {
    if ((!(typeof login_jwt === 'string' && login_jwt.length > 0))  || new_user()) {
      return (
        <div>
          <div className="OutputTitleContainer" >
            <span className="OutputTitle" ><strong>Tutorial Video</strong></span>
          </div>
          <div className="video-responsive">
            <iframe
              width="853"
              height="480"
              src={`https://www.youtube.com/embed/${embedId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Embedded youtube"
            />
          </div>
        </div>
      );
    } else {
      return null;
    }
  };
  
  YoutubeEmbed.propTypes = {
    embedId: PropTypes.string.isRequired,
    login_jwt: PropTypes.string
  };
    
export default YoutubeEmbed;