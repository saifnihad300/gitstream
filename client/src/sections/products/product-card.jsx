import { Stack } from '@mui/material'
import React from 'react'
import PropTypes from 'prop-types';
import RepositoryCard from '../feed/repository';

const FeedCards = ({items}) => (
  <Stack spacing={2}>
   {items.map((item)=>(
     <RepositoryCard {...item}/>
   ))}
  </Stack>
)

FeedCards.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      full_name: PropTypes.string,
      description: PropTypes.string,
      owner: PropTypes.shape({
        avatar_url: PropTypes.string,
      }),
      homepage: PropTypes.string,
      stargazers_count: PropTypes.number,
      forks_count: PropTypes.number,
      updated_at: PropTypes.string,
      topics: PropTypes.arrayOf(PropTypes.string),
      licence: PropTypes.shape({
        name: PropTypes.string,
      }),
      created_at: PropTypes.string,
      language: PropTypes.string,
      html_url: PropTypes.string,
      watchers_count: PropTypes.number,
      languageData: PropTypes.shape({}), // As per RepositoryCard
    })
  ).isRequired,
};

export default FeedCards