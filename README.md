# Project Name
2800-202410-BBY23 - Better U

## About Us
Team Name: BBY-23
Team Members: 
- Jeremy Testa
- Jonathan Hilde
- Nathan Hilde
- Maksim Sadreev
- Radmir Garipov

## Project Description
We are BBY – 23, Radmir, Nathan, Jeremy, Jonathan, and Maksim. As technology advances, we become more isolated, lose vital social skills, and feel lonelier. That’s where Better U comes in—a self-improvement app designed to help you become the person you want to be, the better version of you! Our app includes an interpersonal skills trainer to enhance your social interactions, a habit tracker and hobby finder to develop new interests, and a study section to optimize learning.

## Technologies used
### Frontend
- HTML
- EJS
- CSS
- Bootstrap
- Javascript
- jQuery
- JSON

### Backend
- Node
- Express
- Passport
- Bcrypt

### Database
- MongoDB
- Mongoose

### other tech used
- Render
- Git
- Github
- Google icons
- Popper
- ChatGPT 4.0/4o
- Copilot


## Listing of File Contents of folder
Modules
-chat.js
-chatRoomSchema.js
-habit.js
-habitSchema.js
-home.js
-interpersonal.js
-passport.js
-profile.js
-queueSchema.js
-study.js
-studySession.js
-timerSchema.js
-user.js

scenario
-scenari1.json
-scenari2.json
-scenari3.json
-scenari4.json
-scenari5.json
-scenari6.json

webApp
-public (folder)
-views (folder)
    public
        -css (folder)
        -img (folder)
        -js (folder)
            css
                -addHabit.css
                -background.css
                -breakSession.css
                -chatroom.css
                -guides.css
                -habitIndex.css
                -habitList.css
                -habitQuestion.css
                -home.css
                -index.css
                -interpersonal.css
                -profile.css
                -scenarioSelect.css
                -sidebar.css
                -studyGuide.css
                -studyLog.css
                -studyPage.css
                -studySession.css
                -style.css
                -waitingRoom.css

            img
                -404.gif
                -avatar_lvl1.png
                -avatar_lvl2.png
                -bad_habit.gif
                -badhabit.png
                -better_u_logo.png
                -betterU.ico
                -blurry-gradient-haikei
                -email-sent.png
                -EXO.ico
                -expl.png
                -fail-icon.png
                -feynman.png
                -feynman(gif).gif
                -good_habit.gif
                -hamburg.png
                -incorrect.png
                -loginFail.png
                -pomodoro.png
                -pomodoro(gif).gif
                -recall.png
                -recall(gif).gif
                -reset.png
                -sc1_q1_ans1.png
                -sc1_q1_ans2.png
                -sc1_q1_ans3.png
                -sc1_q1_ans4.png
                -sc1_q4_ans1.png
                -sc1_q4_ans2.png
                -sc1_q4_ans3.png
                -sc1_q4_ans5.png
                -scenario1.png
                -scenario2(gif).gif
                -scenario3.png
                -scenario3(gif).gif
                -scenario4.png
                -scenario4(gif).gif
                -scenario5.png
                -scenario5(gif).gif
                -scenario6.png
                -scenario6(gif).gif
                -skybg.jpeg
                -stars.svg
                -studyGuide.png
                -studyGuide(gif).gif
                -studyLog.png
                -studyLog(gif).gif
                -studySession.png
                -studySession(gif).gif
                -success-icon.png
                -teaching.png
                -wall-e-pixar.gif
            js
                -breakTimer.js
                -chatroom.js
                -client.js
                -ClientSideHabit.js
                -ClientSideProfile.js
                -ClientSideStudy.js
                -game.js
                -habitGraph.js
                -timer.js
                -waitingRoom.js
    
    views
        -template(folder)
        -404.ejs
        -actRecall.ejs
        -chatroom.ejs
        -editProfile.ejs
        -feynman.ejs
        -habitAdd.ejs
        -habitIndex.ejs
        -habitList.ejs
        -habitQuestion.ejs
        -home1.ejs
        -index.ejs
        -interpersonal.ejs
        -pomodoro.ejs
        -profile.ejs
        -resetPassword.ejs
        -select_scenario.ejs
        -studyGuide.ejs
        -studyLog.ejs
        -studyPage.ejs
        -studySession.ejs
        -waitingRoom.ejs

        template
            -footer.ejs
            -header.ejs
            -scenarioCard.ejs
-.env
-.gitignore
-app.js
-package-lock.json
-package.json
-README.md


## How to install or run the project
What does the developer need to install
    Languages 
    - Install node
    - Using package.json do npm i in terminal
    IDEs
    - We used visual studio code. The IDE used does not matter
    Database
    - We used mongoDB
    Other software
    - No other software was used.

We did not use any API's other than the ones in node. And mongodb.

the order of which you install things does not matter.
You can't do npm i without node anyway.

https://docs.google.com/spreadsheets/d/1NEOkIcKHYYFC4i8jGHtGvqvuczyaaCTB_hpqbIF-Nkw/edit

Make sure you make a .env file with the contents of passwords.txt

## How to use the product


## Credits, References, and Licenses
### Credits
This project was developed by the following team members:
- **Jeremy Testa**: Full-Stack Developer
- **Jonathan Hilde**: Backend Developer
- **Nathan Hilde**: Frontend Developer and Designer
- **Maksim Sadreev**: Frontend Developer and Designer
- **Radmir Garipov**: Backend Developer 

Each team member played a crucial role in the development of this project. Their contributions have been invaluable.

### References
The following resources were instrumental in the development of this project:

- HTML, CSS, JavaScript: Mozilla Developer Network (MDN) Web Docs
- EJS: EJS Official Documentation
- Bootstrap: Bootstrap Official Documentation
- jQuery: jQuery Official Documentation
- JSON: JSON Official Website
- Node.js: Node.js Official Documentation
- Express.js: Express.js Official Documentation
- Passport.js: Passport.js Official Documentation
- Bcrypt: Bcrypt GitHub Repository
- MongoDB: MongoDB Official Documentation
- Mongoose: Mongoose Official Documentation
- Render: Render Official Documentation
- Git: Pro Git Book
- GitHub: GitHub Docs
- Google Icons: Google Material Icons Guide
- Popper: Popper Official Documentation

### Licenses
The following open-source libraries were used in this project and are licensed under the MIT License:
- Bootstrap
- Node.js
- Express.js
- jQuery
- Mongoose
- Popper.js


## AI services and products
Maksim Sadreev:
I utilized AI to enhance various aspects of the codebase.
Specifically:
1. ChatGPT enerated six unique scenarios designed to help users practice and improve their social interaction skills.
2. ChatGPT also created six corresponding JSON files for these scenarios, ensuring that the game can easily parse and utilize the content.
3. ChatGPT assisted in creating several functions, such as:
   - toggleCard function in select_scenario.ejs, studyGuide.ejs, and studyPage.ejs
   - showQuestion function in game.js
4. ChatGPT helped in understanding how to read each JSON file synchronously and parse the JSON content of each file in interpersonal.js.
5. ChatGPT wrote habitGraph.js as we did not know how to add a graph into our project. The code has been commented by us.

Nathan Hilde:
I used Copilot and ChatGPT to create base templates for EJS files.

Jonathan Hilde:

Jeremy Testa:

Radmir Garipov:
I used chatGPT for habitGraph.js as well as helping me debug stuff by writing console logs and giving me tips on how to fix problems.
All console logs written by chat have been removed.

## Contact information 
Jeremy Testa:
- jeremy_testa@hotmail.com
Jonathan Hilde:
- cyconiexo@gmail.com
Nathan Hilde:
 - nathan.hilde1@gmail.com
Maksim Sadreev:
- msadreev@my.bcit.ca
Radmir Garipov:
- radmirgaripovrss@gmail.com
