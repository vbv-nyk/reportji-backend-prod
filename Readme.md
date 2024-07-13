This project focuses on reversing the user input so it can be parsed into latex.
The goal is to convert the user's input into my language.

Frontend design expectations
Option to create multiple pages
Under the page, we can provide a name for the chapter
Then we can allow the user to input a title-paragraph pair
The user can then insert author name, figures, date, differences in the provided field

Design perspective,

User first inserts the heading for the page
Then the user selects the title
Then the user selects the type of input from the dropdown and a relevant input field appears.
User enters the required content and the either moves on to the next section or selects the next page.

Input considerations
    Pages shall be stored as an array
    Inside each page, we'll have an array of elements where the content of the element is the type of the element along with the content of the array. This content can be scalar or the vector.
    
    Dealing with scalar types:
        Title, subtitle, heading, author, date, are some of the examples of scalar types, this means that they only contain a single text field;
        Dealing with this is easy, since we just need to accept the type of the input along with the content and send it the backend, the backend will inflate it respectively.
        
    Dealing with vector types:
        There are some special considerations when dealing with vector types, especially figures and tables.

        Dealing with paragraphs, items and citations can be done in the following manner.
        1) The user selects the kind of input from the dropdown.
        2) The input is then split into relevant structures. 
        Following are how we can deal with different vector types:
            Paragraphs, items, citations split at every new line

        Special data types:
            Figures: Figures are a vector type, each figure array accepts a caption which provides a placeholder in the output tex
            file and gets listed into the list of figures.
            Tables: Tables will first require the user to enter the number of columns, 
                After this the user will enter the content for every column n number of text areas where each text area defines the content for every column.
                The content inside the text area can then be split at every text area, thereby providing us with m rows.
We return the language to the users.
