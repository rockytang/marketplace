# Design Pattern Desicision
A Circuit Breaker Design is implemented so the Admin has the ability to stop the inflow and outflows of funds at any time.  
A Mutual Exclusion, or mutex, design is implemented to prevent reentrancy attacks and only 1 user can withdraw funds at a time.  
I chose to write a monolithic code base to make readability easier.  
I used the Pull Payment system to prevent unexpected reverts causing DoS.  
The Commit Reveal design pattern was not implemented because there was no voting feature in this app.  
However, I have written a small gambling game if you are interested in seeing how the Commit Reveal design pattern works: https://github.com/rockytang/commit-reveal-pattern   
