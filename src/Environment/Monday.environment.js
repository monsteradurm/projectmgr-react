export const MondayConfig = {
    token: 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjEwNDEzNzg0NSwidWlkIjoxNjMzMzQ1LCJpYWQiOiIyMDIxLTAzLTI0VDA2OjA1OjAzLjU2MFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo2OTc5NzksInJnbiI6InVzZTEifQ.F33TvuwKuKzIyipXblbTRrlJ2aAtVA3C9ZPVCZKsIAc',
    client_id:  'ddc4de8eafde865ef1b2418acafa0acb',
    client_sec: '78278e7064170bfb9d305cef21aeb0f6',
    client_ss: '78278e7064170bfb9d305cef21aeb0f6',
    tokenURL: 'https://auth.monday.com/oauth2/authorize?client_id=ddc4de8eafde865ef1b2418acafa0acb'
}

export const MondayGraphQL = {

    Query_AllTeams: `query{teams{
      id name users {
        id name
      }
    }}`,

    Query_BoardId: (itemId) => `query {
      items (ids:${itemId}){
        board { id }
      }
    }`,

    Query_AllUsers: () => 
    `query {
      users {
        id
        name
        email
        title
      }
    }`,

    Query_Webhooks: (boardId) => `query{ webhooks(board_id: ${boardId}) {
      id event config  
      } 
    }`,

    Query_ColumnSettings: (id) => 
    `query {
        boards (ids:${id}) {
         columns {
          settings_str id title
         }
        }
      }`,

      Query_AllTags: () => `query {
        tags {
            id name
        }
      }`,

    Query_TagId: (label) => `mutation {
        create_or_get_tag (tag_name: "${label}") {
          id
        }
      }`,

    Query_ItemUpdates: (id) => `query {
        items (ids: [${id}]) {
            id
            updates (limit: 50) {
                text_body id updated_at body
            }
        }
      }`,

    Mutate_Update: (id, content) => 
        `mutation {
          create_update (item_id: ${id}, body: "${content}") {
              id
          }
        }`,
    Mutate_SimpleColumn: (boardId, itemId, columnId, statusIndex)  => 
        `mutation { change_simple_column_value (board_id: ${boardId}, item_id: ${itemId}, 
            column_id: "${columnId}", value: "${statusIndex}") { id } }`,

    Mutate_TagsColumn: (boardId, itemId, columnId, val)  => 
        `mutation { change_column_value (board_id: ${boardId}, item_id: ${itemId}, 
            column_id: "${columnId}", value: "${JSON.stringify(val).replace(/"/g, '\\"')}") { id } }`,

    Mutate_Columns: (boardId, itemId, val) => `
        mutation { change_multiple_column_values (board_id: ${boardId}, item_id: ${itemId},
            column_values: "${JSON.stringify(val).replace(/"/g, '\\"')}", create_labels_if_missing: true) 
          { id }
        }`,
    
    ArchiveItem: (itemId) => `mutation {
      archive_item (item_id: ${itemId}) {
          id
      }
    }`,

    Support_ManagementGroups: `query { boards (ids:3335572476) {
      id
      groups{
        id title
      }
      columns{
        id title settings_str
      }
    }
  }`, 

    Support_TechnicalGroups: `query { boards (ids:3335860615) {
        id
        groups{
          id title
        }
        columns{
          id title settings_str
        }
      }
    }`, 

    Support_SoftwareGroups: `query { boards (ids:3336095486) {
      id
        groups{
          id title
        }
        columns{
          id title settings_str
        }
      }
    }`, 

    SupportTickets: (boardId, groupId) => `query { boards (ids: ${boardId}) {
      groups(ids: ${groupId}) {
          items {
            updated_at
            created_at
            id
            name
            column_values {
              id title text additional_info value
            }
          }
        }
      }
    }`,
    
    ApplicationsTeam: `query{ teams (ids:717652) {
      id
      name
      users {
        id
        name
      }
    }}`,
    
    ManagementTeam: `query{ teams (ids:434736) {
      id
      name
      users {
        id
        name
        email
      }
    }}`,
    
    EODReportTeam: `query{ teams (ids:727332) {
      id
      name
      users {
        id
        name
        email
      }
    }}`,

    Mutate_DateColumn: (boardId, itemId, columnId, date) => {
      const value = date ? {date} : { }
       return `mutation {
        change_column_value(item_id:${itemId}, board_id:${boardId}, 
          column_id: ${columnId}, value: "${JSON.stringify(value).replace(/"/g, '\\"')}") {
            id
          }
        }`
      },

      Mutate_TimelineColumn: (boardId, itemId, columnId, from, to) => {
        const value = {from, to }
         return `mutation {
          change_column_value(item_id:${itemId}, board_id:${boardId}, 
            column_id: ${columnId}, value: "${JSON.stringify(value).replace(/"/g, '\\"')}") {
              id
            }
          }`
        },

      Mutate_PeopleColumn: (boardId, itemId, columnId, ids) => {
        const data = {personsAndTeams: ids.map(id => ({id, kind:"person"}))};
        let values = JSON.stringify(data).replace(/"/g, '\\"');
        return `mutation {
          change_column_value(item_id: ${itemId}, board_id: ${boardId}, 
            column_id: ${columnId}, value: "${values}") {
                id
              }
          }`
    },

    Create_Item: (board_id, group_id, item_name) => `
      mutation {
        create_item (board_id: ${board_id}, group_id: "${group_id}", item_name: "${item_name}") {
            id
        }
      }`,
    Create_SubItem: (itemId, name) => 
        `mutation {
            create_subitem (parent_item_id: ${itemId}, item_name: "${name}") {
                id
                column_values{
                  text title id additional_info
                }
                board { id }
            }
        }`
}