# Avoiding Common Attacks
Reentraceny attacks are prevented by implementing Mutex design, and only 1 user can withdraw at any given moment.  
Integer overflows are prevented by checking for overflows and also using the SafeMath library.  
Since timestemps can be manipulated by miners, I chose not to use block timestamps.
DoS (Unexpected) Reverts and DoS with Block Gas Limits are prevented by using the pull payment system design.  
