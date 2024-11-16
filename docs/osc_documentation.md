# Introduction to Open Sound Control

This documentation is extracted from the Holophonix OSC Documentation.

## OSC Pattern Matching

OSC addresses may contain pattern-matching characters:
- `?` matches any single character
- `*` matches any sequence of zero or more characters
- `[abc]` matches any character in the list (in this case 'a', 'b', or 'c')
- `[!abc]` matches any character not in the list
- `{foo,bar}` matches either 'foo' or 'bar'

### Examples:
```
/track/[1-4]/xyz     # Matches tracks 1 through 4
/track/*/azim        # Matches azimuth of any track
/track/[!0]/active   # Matches any track except track 0
/track/{1,3,5}/dist  # Matches distance of tracks 1, 3, and 5
```

## Track Groups
You can use pattern matching to control multiple tracks simultaneously:
```
# Move all tracks in a range
/track/[1-16]/x 0.5

# Set azimuth for odd-numbered tracks
/track/{1,3,5,7,9}/azim 90

# Move all tracks
/track/*/xyz 0 0 0

# Activate a range of tracks
/track/[1-8]/active 1
```
