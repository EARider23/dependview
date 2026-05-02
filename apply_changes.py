import sys

def main():
    with open('src/App.jsx', 'r', encoding='utf-8') as f:
        app_content = f.read()

    with open('src/App.precision-engine.backup.jsx', 'r', encoding='utf-8') as f:
        backup_content = f.read()

    # We need to find the start and end of the block in App.jsx
    start_marker_app = '              {/* Controls */}'
    end_marker_app = '          {/* SYSTEM PACKAGES VIEW */}'
    
    start_idx_app = app_content.find(start_marker_app)
    end_idx_app = app_content.find(end_marker_app)
    
    if start_idx_app == -1 or end_idx_app == -1:
        print("Could not find markers in App.jsx")
        return

    # Find the corresponding block in backup
    start_marker_backup = '              {/* Controls & Search Bar */}'
    end_marker_backup = '          {/* SYSTEM PACKAGES VIEW */}'
    
    start_idx_backup = backup_content.find(start_marker_backup)
    end_idx_backup = backup_content.find(end_marker_backup)

    if start_idx_backup == -1 or end_idx_backup == -1:
        print("Could not find markers in Backup")
        return

    replacement_block = backup_content[start_idx_backup:end_idx_backup]
    
    new_app_content = app_content[:start_idx_app] + replacement_block + app_content[end_idx_app:]
    
    # 1. System packages view animation
    new_app_content = new_app_content.replace(
'''              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}''',
'''              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}'''
    )

    # 2. Maintenance view animation
    new_app_content = new_app_content.replace(
'''              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}''',
'''              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}'''
    )

    # 3. History view animation
    new_app_content = new_app_content.replace(
'''              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}''',
'''              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}'''
    )

    # 4. Frameworks view animation
    new_app_content = new_app_content.replace(
'''              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}''',
'''              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}'''
    )

    # 5. Create project view
    new_app_content = new_app_content.replace(
'''            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[100] bg-white overflow-hidden"
            >''',
'''            <motion.div
              key="create-project"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 bg-white"
            >'''
    )

    with open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(new_app_content)
    
    print("Replacements done successfully.")

if __name__ == '__main__':
    main()
