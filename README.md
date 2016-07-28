# MicroClickRS
Vitality II

Goals

Methods
- isDegraded
- isDepleted
- interact

Properties
- health
- lives

Herbs to collect from farming (in order of goodness):
- Marrentill
- Ranarr
- Snapdragon
- Dwarf weed

EARN FAVOUR AND RESOURCES

Skills
- Woodcutting
    - Interact
        - Lose health
            - if health is 0
                - degrade (lose life)
                - if lives is 0
                    - deplete
                    - respawn new tree
                - else
                    - respawn same tree
- Farming
    - Interact (multiple resources on screen)
        - degrade (Gather resource)
        - if resource is 0
            - deplete
            - respawn new patch
        - else 
            - respawn same patch

