# Emby Fixer

Execute a number of fixes on emby's library to make its Music collection functionality usable for folder view. This is done by stopping the server, updating its database and restarting.

Fixes:

- Find huge directories which emby decided to treat as albums and convert them to directories. This is because too big music collections inside one directory tend to clog up the UI and make it unusable.

- Make emby display music directories with their actual title, instead of some algorithmically derived random shit. More info: https://emby.media/community/index.php?/topic/16984-view-libraries-as-they-are-stored-by-folders/page-4

### Setup

Create `.env` and fill in required envs from `settings.js`. Need to run as root, or do some fancy sudoer stuff.
