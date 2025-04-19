import { Box, Button, Link, Avatar, Card, CardActions, CardContent, Stack, Chip, CardHeader, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import React from 'react'
import PropTypes from 'prop-types';
import {format, formatDistanceToNow} from 'date-fns';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ForkRightIcon from '@mui/icons-material/ForkRight';
import TodayIcon from '@mui/icons-material/Today';
import ShareIcon from '@mui/icons-material/Share';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { ExpandCircleDownOutlined } from '@mui/icons-material';


const RepositoryCard = ({
    full_name = '',
    description = '',
    owner={},
    homepage='',
    stargazers_count=0,
    watchers_count = 0,
    forks_count = 0,
    updated_at = '',
    topics = [],
    licence = {},
    created_at = '',
    language = '',
    html_url = '',
    languageData = {}
    })=>{
    const timeSinceCreation = formatDistanceToNow(new Date(created_at), {addSuffix: true});
    const formatUpdateAt = format(new Date(updated_at), 'MMM dd, yyy');
    const totalLinesOfCode = Object.values(languageData).reduce((a, b)=> a+b, 0);
    
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl)
    const handleClick = (event)=>{
        setAnchorEl(event.currentTarget);
    }

    const handleClose = ()=>{
        setAnchorEl(null);
    }

    return(
     <Card variant = "outlined">
        <CardHeader
         avatar = {<Avatar src = {owner.avatar_url} />}
         title = {full_name}
         subheader = {timeSinceCreation}
        />
        <CardContent>
         <Stack spacing={2} flexwrap="wrap">
         <Stack flexwrap = "wrap">
           <Typography>
             {description}
           </Typography>
          </Stack>
          <Stack direction = "row" spacing = {1} margin={1} flexwrap="wrap">
            {Object.entries(languageData).map(([lng, linesOfCode]) => (
                <Box paddingTop = {1}>

                 <Chip
                  key = {lng}
                  label = {`${lng}: ${((linesOfCode/totalLinesOfCode)*100).toFixed(2)}%`}
                  variant= "outlined"
                  size = "small"
                 />
                </Box>
            ))}
          </Stack>
          <Stack direction = "row" spacing={1} mt = {1}>
            <Box display = "flex" alignItems = "center">
              <StarIcon/>
              <Typography variant = "body2" ml={0.5}>
               {stargazers_count}
              </Typography>
            </Box>
            <Box display= "flex" alignItems="center">
             <VisibilityIcon/>
             <Typography variant="body2" ml = {0.5}>
              {watchers_count}
             </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <ForkRightIcon/>
              <Typography variant="body2" ml={0.5}>
               {forks_count}
              </Typography>
            </Box>
          </Stack>
          <Stack>
            <Box display="flex" alignItems="center">
              <TodayIcon/>
              <Typography variant = "body2" ml={0.5}>
                 updated on {formatUpdateAt}
              </Typography>
            </Box>
          </Stack>
          <Stack spacing = {2} direction="row">
           {homepage && (
            <Link href={homepage} target = "_blank" rel = "noopener noreferrer">
             {homepage}
            </Link>
           )}
           {
            html_url && (
                <Link href = {html_url} target = "_blank" rel = "noopener noreferrer">
                 {html_url}
                </Link>
            )
           }
          </Stack>
          <Stack>
            {licence && (
                <Box display="flex" alignItems="center">
                 <Link href={licence.url} target="_blank" variant="body2" color= "text.secondary">
                 Licence: {licence.name}
                 </Link>
                </Box>
            )}
          </Stack>
         </Stack>

        </CardContent>

        <CardActions disableSpacing>
           <IconButton>
             <ShareIcon/>
           </IconButton>
           <IconButton>
             <BookmarkIcon/>
           </IconButton>
           <IconButton>
             <ChatBubbleOutlineIcon/>
           </IconButton>
           <IconButton>
            <ThumbUpIcon/>
           </IconButton>
           <IconButton onClick={handleClick}>
            <MoreHorizIcon />
           </IconButton>
           
           <Button variant="text" endIcon={<ExpandCircleDownOutlined/>}>
             Details
           </Button>
           
           <Menu anchorEl={anchorEl} open={open} onClose = {handleClose}>
            <MenuItem onClick={handleClose}> option 1</MenuItem>
            <MenuItem onClick={handleClose}> option 2</MenuItem>
           </Menu>
        </CardActions>
     </Card>
    )
}

RepositoryCard.propTypes = {
    full_name : PropTypes.string,
    description: PropTypes.string,
    owner: PropTypes.shape ({
        avatar_url : PropTypes.string,
    }),

    homepage: PropTypes.string,
    stargazers_count: PropTypes.number,
    forks_count: PropTypes.number,
    updated_at: PropTypes.string,
    topics: PropTypes.arrayOf(PropTypes.string),
    licence: PropTypes.shape({
        name: PropTypes.string,
    }),
    created_at : PropTypes.string,
    language: PropTypes.string,
    html_url: PropTypes.string,
    watchers_count: PropTypes.number,
    /* eslint-disable react/forbid-prop-types */
    languageData: PropTypes.object,
    /* eslint-enable react/forbid-prop-types */

}
export default RepositoryCard