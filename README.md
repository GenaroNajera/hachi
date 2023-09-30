# hachi

JavaScript multiplayer game concept using WebSockets.

To play, clone the repo and go to the cloned directory.  
Then, in the terminal, type
```
npm install
npm start
```
Next, open `index.html` in the browser.

## Game Rules

Players can create or join a room. Creating a room generates a Room ID, which a joining player inputs in order to join.

![home](/images/home.png)

Only two players per room. Both players start with 8 moves, are assigned a color, and take turns selecting one cell from an 8 x 8 board. Each cell has a value. Players can select an unoccupied cell or a cell occupied by the opponent.
- If click unoccupied cell: The player's score increases by the value of the cell, and the cell changes color to match the player's color, meaning the player occupies the cell
- If click cell occupied by opponent: The cell and the surrounding cells that are occupied by the opponent become occupied by the player (flood fill), and the player's score increases by the values of those cells, while the opponent's score decreases by the same amount

![board](/images/board_1.png)
![board](/images/board_2.png)

The game finishes when both players run out of moves. The player with the highest score is the winner.

![winner](/images/winner.png)